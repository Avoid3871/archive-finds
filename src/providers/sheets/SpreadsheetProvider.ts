export interface RawSpreadsheetRow {
  title?: string;
  imageUrl?: string;
  link?: string;
  price?: string | number;
  brand?: string;
  category?: string;
  raw: Record<string, any>;
}

export interface ISpreadsheetProvider {
  readonly name: string;
  fetchRows(spreadsheetId: string, sheetName?: string): Promise<RawSpreadsheetRow[]>;
}
