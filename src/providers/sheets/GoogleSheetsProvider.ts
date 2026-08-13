import { ISpreadsheetProvider, RawSpreadsheetRow } from "./SpreadsheetProvider";

export class GoogleSheetsProvider implements ISpreadsheetProvider {
  readonly name = "google-sheets";
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_SHEETS_API_KEY;
  }

  /**
   * Reads public CSV export or API data for zero-cost operation
   */
  async fetchRows(spreadsheetId: string, sheetName = "Sheet1"): Promise<RawSpreadsheetRow[]> {
    if (!spreadsheetId) {
      throw new Error("Spreadsheet ID is required");
    }

    try {
      // 1. Try public CSV export (Zero API key required for published / shared sheets)
      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
      const response = await fetch(csvUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch CSV export: HTTP ${response.status}`);
      }

      const csvText = await response.text();
      return this.parseCsv(csvText);
    } catch (error) {
      console.warn(`[GoogleSheetsProvider] CSV export fetch failed for ${spreadsheetId}, returning empty set:`, error);
      return [];
    }
  }

  private parseCsv(csvText: string): RawSpreadsheetRow[] {
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) return [];

    // Extract headers (remove surrounding quotes)
    const rawHeaders = this.parseCsvLine(lines[0]);
    const headers = rawHeaders.map((h) => h.toLowerCase().trim());

    const rows: RawSpreadsheetRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      if (values.length === 0 || values.every((v) => !v.trim())) continue;

      const rowObj: Record<string, any> = {};
      headers.forEach((h, index) => {
        rowObj[h] = values[index] || "";
      });

      // Flexible column matcher
      const title =
        rowObj["name"] ||
        rowObj["product"] ||
        rowObj["product name"] ||
        rowObj["title"] ||
        rowObj["item"] ||
        "";

      const imageUrl =
        rowObj["image"] ||
        rowObj["picture"] ||
        rowObj["photo"] ||
        rowObj["img"] ||
        rowObj["image url"] ||
        "";

      const link =
        rowObj["link"] ||
        rowObj["url"] ||
        rowObj["sugargoo"] ||
        rowObj["product link"] ||
        rowObj["buy link"] ||
        "";

      const price =
        rowObj["price"] ||
        rowObj["cost"] ||
        rowObj["eur"] ||
        rowObj["price (€)"] ||
        "";

      const brand =
        rowObj["brand"] ||
        rowObj["designer"] ||
        "";

      const category =
        rowObj["category"] ||
        rowObj["type"] ||
        "";

      if (title || link) {
        rows.push({
          title,
          imageUrl,
          link,
          price,
          brand,
          category,
          raw: rowObj,
        });
      }
    }

    return rows;
  }

  private parseCsvLine(text: string): string[] {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  }
}
