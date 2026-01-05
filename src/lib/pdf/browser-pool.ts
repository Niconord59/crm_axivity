/**
 * Browser Pool for Puppeteer PDF Generation
 *
 * Maintains a pool of reusable browser instances to avoid the overhead
 * of launching a new browser for each PDF generation request.
 *
 * Features:
 * - Configurable pool size
 * - Automatic reconnection on disconnect
 * - Graceful shutdown
 * - Singleton pattern for serverless environments
 */

import puppeteer, { Browser, Page } from "puppeteer";

interface PooledBrowser {
  browser: Browser;
  inUse: boolean;
  lastUsed: number;
}

interface PDFOptions {
  format?: "A4" | "Letter";
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

const DEFAULT_PDF_OPTIONS: PDFOptions = {
  format: "A4",
  printBackground: true,
  margin: {
    top: "20mm",
    right: "15mm",
    bottom: "20mm",
    left: "15mm",
  },
};

const BROWSER_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-extensions",
  "--disable-background-networking",
  "--disable-default-apps",
  "--disable-sync",
  "--disable-translate",
  "--metrics-recording-only",
  "--mute-audio",
  "--no-first-run",
  "--safebrowsing-disable-auto-update",
];

class BrowserPool {
  private pool: PooledBrowser[] = [];
  private maxSize: number;
  private initPromise: Promise<void> | null = null;
  private isInitialized = false;
  private shuttingDown = false;

  constructor(maxSize: number = 2) {
    this.maxSize = maxSize;
  }

  /**
   * Initialize the pool with browser instances
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Prevent multiple simultaneous initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    await this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      // Launch initial browsers
      const launchPromises = Array.from({ length: this.maxSize }, () =>
        this.launchBrowser()
      );

      const browsers = await Promise.all(launchPromises);

      this.pool = browsers.map((browser) => ({
        browser,
        inUse: false,
        lastUsed: Date.now(),
      }));

      this.isInitialized = true;
      console.log(`[BrowserPool] Initialized with ${this.maxSize} browsers`);
    } catch (error) {
      console.error("[BrowserPool] Failed to initialize:", error);
      throw error;
    }
  }

  /**
   * Launch a new browser instance
   */
  private async launchBrowser(): Promise<Browser> {
    const browser = await puppeteer.launch({
      headless: true,
      args: BROWSER_ARGS,
    });

    // Handle unexpected disconnection
    browser.on("disconnected", () => {
      this.handleBrowserDisconnect(browser);
    });

    return browser;
  }

  /**
   * Handle browser disconnection - remove from pool and replace
   */
  private async handleBrowserDisconnect(browser: Browser): Promise<void> {
    if (this.shuttingDown) return;

    const index = this.pool.findIndex((pb) => pb.browser === browser);
    if (index !== -1) {
      console.log("[BrowserPool] Browser disconnected, replacing...");
      this.pool.splice(index, 1);

      try {
        const newBrowser = await this.launchBrowser();
        this.pool.push({
          browser: newBrowser,
          inUse: false,
          lastUsed: Date.now(),
        });
        console.log("[BrowserPool] Browser replaced successfully");
      } catch (error) {
        console.error("[BrowserPool] Failed to replace browser:", error);
      }
    }
  }

  /**
   * Acquire a browser from the pool
   */
  async acquire(): Promise<Browser> {
    await this.initialize();

    // Find an available browser
    const available = this.pool.find((pb) => !pb.inUse);

    if (available) {
      available.inUse = true;
      available.lastUsed = Date.now();

      // Check if browser is still connected
      if (!available.browser.connected) {
        // Remove disconnected browser and try to get another
        const index = this.pool.indexOf(available);
        this.pool.splice(index, 1);

        try {
          const newBrowser = await this.launchBrowser();
          const pooledBrowser: PooledBrowser = {
            browser: newBrowser,
            inUse: true,
            lastUsed: Date.now(),
          };
          this.pool.push(pooledBrowser);
          return newBrowser;
        } catch (error) {
          console.error("[BrowserPool] Failed to create replacement browser:", error);
          throw error;
        }
      }

      return available.browser;
    }

    // No available browser - wait a bit and retry, or create a new one
    console.log("[BrowserPool] No available browser, creating temporary instance");

    // Launch a temporary browser (won't be pooled)
    return this.launchBrowser();
  }

  /**
   * Release a browser back to the pool
   */
  release(browser: Browser): void {
    const pooled = this.pool.find((pb) => pb.browser === browser);

    if (pooled) {
      pooled.inUse = false;
      pooled.lastUsed = Date.now();
    } else {
      // This was a temporary browser, close it
      browser.close().catch((err) => {
        console.error("[BrowserPool] Error closing temporary browser:", err);
      });
    }
  }

  /**
   * Generate a PDF from HTML content
   * Returns Buffer for compatibility with Next.js Response and Supabase Storage
   */
  async generatePDF(
    html: string,
    options: PDFOptions = {}
  ): Promise<Buffer> {
    const browser = await this.acquire();
    let page: Page | null = null;

    try {
      page = await browser.newPage();

      // Set content and wait for network to be idle
      await page.setContent(html, { waitUntil: "networkidle0" });

      // Generate PDF
      const pdfOptions = { ...DEFAULT_PDF_OPTIONS, ...options };
      const pdfBuffer = await page.pdf(pdfOptions);

      // Convert to Buffer for type compatibility
      return Buffer.from(pdfBuffer);
    } finally {
      // Always close the page
      if (page) {
        await page.close().catch(() => {
          // Ignore page close errors
        });
      }

      // Release browser back to pool
      this.release(browser);
    }
  }

  /**
   * Shutdown the pool and close all browsers
   */
  async shutdown(): Promise<void> {
    this.shuttingDown = true;

    console.log("[BrowserPool] Shutting down...");

    const closePromises = this.pool.map((pb) =>
      pb.browser.close().catch((err) => {
        console.error("[BrowserPool] Error closing browser:", err);
      })
    );

    await Promise.all(closePromises);

    this.pool = [];
    this.isInitialized = false;
    this.initPromise = null;
    this.shuttingDown = false;

    console.log("[BrowserPool] Shutdown complete");
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    total: number;
    available: number;
    inUse: number;
    initialized: boolean;
  } {
    return {
      total: this.pool.length,
      available: this.pool.filter((pb) => !pb.inUse).length,
      inUse: this.pool.filter((pb) => pb.inUse).length,
      initialized: this.isInitialized,
    };
  }
}

// Singleton instance for serverless environments
let poolInstance: BrowserPool | null = null;

/**
 * Get the singleton browser pool instance
 */
export function getBrowserPool(maxSize: number = 2): BrowserPool {
  if (!poolInstance) {
    poolInstance = new BrowserPool(maxSize);
  }
  return poolInstance;
}

/**
 * Generate PDF using the singleton pool
 * Convenience function for simple use cases
 * Returns Buffer for compatibility with Next.js Response and Supabase Storage
 */
export async function generatePDF(
  html: string,
  options: PDFOptions = {}
): Promise<Buffer> {
  const pool = getBrowserPool();
  return pool.generatePDF(html, options);
}

/**
 * Shutdown the singleton pool
 * Call this during application shutdown
 */
export async function shutdownBrowserPool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.shutdown();
    poolInstance = null;
  }
}

export { BrowserPool };
export type { PDFOptions };
