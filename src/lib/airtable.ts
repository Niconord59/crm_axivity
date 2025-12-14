// Airtable API Client for CRM Axivity
import { AIRTABLE_TABLES, type AirtableTable } from "./airtable-tables";

const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;

const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

interface AirtableRecord<T = Record<string, unknown>> {
  id: string;
  createdTime: string;
  fields: T;
}

interface AirtableResponse<T = Record<string, unknown>> {
  records: AirtableRecord<T>[];
  offset?: string;
}

interface AirtableQueryParams {
  fields?: string[];
  filterByFormula?: string;
  maxRecords?: number;
  pageSize?: number;
  sort?: { field: string; direction: "asc" | "desc" }[];
  view?: string;
  offset?: string;
}

class AirtableClient {
  private headers: HeadersInit;

  constructor() {
    if (!AIRTABLE_API_KEY) {
      console.warn("Airtable API key not configured");
    }
    this.headers = {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    };
  }

  private buildQueryString(params: AirtableQueryParams): string {
    const searchParams = new URLSearchParams();

    if (params.fields) {
      params.fields.forEach((field) => searchParams.append("fields[]", field));
    }
    if (params.filterByFormula) {
      searchParams.set("filterByFormula", params.filterByFormula);
    }
    if (params.maxRecords) {
      searchParams.set("maxRecords", params.maxRecords.toString());
    }
    if (params.pageSize) {
      searchParams.set("pageSize", params.pageSize.toString());
    }
    if (params.sort) {
      params.sort.forEach((s, i) => {
        searchParams.set(`sort[${i}][field]`, s.field);
        searchParams.set(`sort[${i}][direction]`, s.direction);
      });
    }
    if (params.view) {
      searchParams.set("view", params.view);
    }
    if (params.offset) {
      searchParams.set("offset", params.offset);
    }

    const query = searchParams.toString();
    return query ? `?${query}` : "";
  }

  async getRecords<T = Record<string, unknown>>(
    table: AirtableTable,
    params: AirtableQueryParams = {}
  ): Promise<AirtableRecord<T>[]> {
    const allRecords: AirtableRecord<T>[] = [];
    let offset: string | undefined;

    do {
      const queryString = this.buildQueryString({ ...params, offset });
      const response = await fetch(
        `${BASE_URL}/${encodeURIComponent(table)}${queryString}`,
        {
          method: "GET",
          headers: this.headers,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Airtable API Error: ${error.error?.message || response.statusText}`
        );
      }

      const data: AirtableResponse<T> = await response.json();
      allRecords.push(...data.records);
      offset = data.offset;
    } while (offset && !params.maxRecords);

    return allRecords;
  }

  async getRecord<T = Record<string, unknown>>(
    table: AirtableTable,
    recordId: string
  ): Promise<AirtableRecord<T>> {
    const response = await fetch(
      `${BASE_URL}/${encodeURIComponent(table)}/${recordId}`,
      {
        method: "GET",
        headers: this.headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Airtable API Error: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  async createRecord<T = Record<string, unknown>>(
    table: AirtableTable,
    fields: Partial<T>
  ): Promise<AirtableRecord<T>> {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(table)}`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Airtable API Error: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  async updateRecord<T = Record<string, unknown>>(
    table: AirtableTable,
    recordId: string,
    fields: Partial<T>
  ): Promise<AirtableRecord<T>> {
    const response = await fetch(
      `${BASE_URL}/${encodeURIComponent(table)}/${recordId}`,
      {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify({ fields }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Airtable API Error: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  async deleteRecord(table: AirtableTable, recordId: string): Promise<void> {
    const response = await fetch(
      `${BASE_URL}/${encodeURIComponent(table)}/${recordId}`,
      {
        method: "DELETE",
        headers: this.headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Airtable API Error: ${error.error?.message || response.statusText}`
      );
    }
  }

  async updateRecords<T = Record<string, unknown>>(
    table: AirtableTable,
    records: { id: string; fields: Partial<T> }[]
  ): Promise<AirtableRecord<T>[]> {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(table)}`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify({ records }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Airtable API Error: ${error.error?.message || response.statusText}`
      );
    }

    const data: AirtableResponse<T> = await response.json();
    return data.records;
  }

  /**
   * Create multiple records in batch (max 10 per request)
   * Automatically chunks larger arrays
   */
  async createRecords<T = Record<string, unknown>>(
    table: AirtableTable,
    records: { fields: Partial<T> }[]
  ): Promise<AirtableRecord<T>[]> {
    const BATCH_SIZE = 10;
    const allCreated: AirtableRecord<T>[] = [];

    // Process in chunks of 10 (Airtable limit)
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);

      const response = await fetch(`${BASE_URL}/${encodeURIComponent(table)}`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ records: batch }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Airtable API Error: ${error.error?.message || response.statusText}`
        );
      }

      const data: AirtableResponse<T> = await response.json();
      allCreated.push(...data.records);

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < records.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return allCreated;
  }
}

export const airtable = new AirtableClient();
export { AIRTABLE_TABLES };
export type { AirtableRecord, AirtableResponse, AirtableQueryParams };
