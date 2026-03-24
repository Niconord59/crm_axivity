import { getServiceClient } from "./lib/supabase.js";
import { logger } from "./lib/logger.js";

export interface ApiKeyInfo {
  userId: string;
  email: string;
  role: string;
  label: string;
}

// In-memory cache with TTL to avoid hitting DB on every request
const cache = new Map<string, { info: ApiKeyInfo; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Validates an API key and returns the associated user info.
 * Keys are stored hashed (SHA-256) in the mcp_api_keys table.
 */
export async function validateApiKey(apiKey: string): Promise<ApiKeyInfo | null> {
  if (!apiKey) return null;

  // Check cache first
  const cached = cache.get(apiKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.info;
  }

  try {
    const supabase = getServiceClient();

    // Hash the key for lookup (keys stored hashed in DB)
    const keyHash = await hashApiKey(apiKey);

    const { data, error } = await supabase
      .from("mcp_api_keys")
      .select(`
        id,
        label,
        user_id,
        profiles!inner(email, role)
      `)
      .eq("key_hash", keyHash)
      .eq("revoked", false)
      .single();

    if (error || !data) {
      logger.warn("API key validation failed", { error: error?.message });
      return null;
    }

    // Update last_used_at (fire-and-forget)
    supabase
      .from("mcp_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id)
      .then();

    const profile = data.profiles as unknown as { email: string; role: string };
    const info: ApiKeyInfo = {
      userId: data.user_id,
      email: profile.email,
      role: profile.role,
      label: data.label,
    };

    // Cache the result
    cache.set(apiKey, { info, expiresAt: Date.now() + CACHE_TTL_MS });

    logger.info("API key authenticated", { email: info.email, role: info.role, label: info.label });
    return info;
  } catch (err) {
    logger.error("API key validation error", { error: String(err) });
    return null;
  }
}

/**
 * Extract API key from Authorization header.
 * Supports: "Bearer <key>" format.
 */
export function extractApiKey(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

/**
 * SHA-256 hash of the API key for secure storage.
 */
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a new API key (for admin use).
 * Returns the raw key (to give to the user) and the hash (to store in DB).
 */
export async function generateApiKey(): Promise<{ rawKey: string; keyHash: string }> {
  const rawKey = `axv_${crypto.randomUUID().replace(/-/g, "")}`;
  const keyHash = await hashApiKey(rawKey);
  return { rawKey, keyHash };
}
