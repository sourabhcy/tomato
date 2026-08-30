import type { NewProduct } from "@/services/productService";

// Shared with the client upload form and the server action so all three layers
// (client pre-check, Next.js server action body limit, parser) agree on the same caps.
export const MAX_CSV_BYTES = 2 * 1024 * 1024; // 2MB
export const MAX_PRODUCT_ROWS = 5000;
const MAX_FIELD_LENGTH = 500;
const MAX_PRICE = 99_999_999.99; // matches products.price NUMERIC(10, 2)

// Leading characters that spreadsheet apps (Excel/Sheets) interpret as formulas
// if this data is ever re-exported and opened - reject rather than silently rewrite.
const FORMULA_INJECTION_PREFIX = /^[=+\-@]/;
const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f]/;

function sanitizeField(value: string, fieldName: string, row: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`Invalid product row: "${row}"`);
  }

  if (trimmed.length > MAX_FIELD_LENGTH) {
    throw new Error(`Invalid product row (${fieldName} too long): "${row}"`);
  }

  if (CONTROL_CHARS.test(trimmed)) {
    throw new Error(`Invalid product row (${fieldName} contains control characters): "${row}"`);
  }

  if (FORMULA_INJECTION_PREFIX.test(trimmed)) {
    throw new Error(`Invalid product row (${fieldName} starts with a disallowed character): "${row}"`);
  }

  return trimmed;
}

// Expects a CSV with header: name,description,price
export function parseProductCsv(csv: string): NewProduct[] {
  if (csv.length > MAX_CSV_BYTES) {
    throw new Error(`CSV exceeds maximum allowed size of ${MAX_CSV_BYTES} bytes`);
  }

  const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const [, ...rows] = lines;

  if (rows.length > MAX_PRODUCT_ROWS) {
    throw new Error(`CSV exceeds maximum allowed rows of ${MAX_PRODUCT_ROWS}`);
  }

  return rows.map((row) => {
    const [rawName, rawDescription, rawPrice] = row.split(",");

    if (rawName === undefined || rawDescription === undefined || rawPrice === undefined) {
      throw new Error(`Invalid product row: "${row}"`);
    }

    const name = sanitizeField(rawName, "name", row);
    const description = sanitizeField(rawDescription, "description", row);
    const priceText = rawPrice.trim();
    const price = Number(priceText);

    if (!priceText || Number.isNaN(price) || !Number.isFinite(price) || price < 0 || price > MAX_PRICE) {
      throw new Error(`Invalid product row: "${row}"`);
    }

    return { name, description, price };
  });
}
