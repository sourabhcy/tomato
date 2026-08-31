import { parse } from "csv-parse/sync";
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

function validateField(value: string, fieldName: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return `${fieldName} is required`;
  }

  if (trimmed.length > MAX_FIELD_LENGTH) {
    return `${fieldName} is too long`;
  }

  if (CONTROL_CHARS.test(trimmed)) {
    return `${fieldName} contains control characters`;
  }

  if (FORMULA_INJECTION_PREFIX.test(trimmed)) {
    return `${fieldName} starts with a disallowed character`;
  }

  return null;
}

export type ProductCsvError = {
  row: number;
  message: string;
};

export type ProductCsvParseResult = {
  products: NewProduct[];
  errors: ProductCsvError[];
};

function isValidStorageKey(value: string) {
  return !value.startsWith("/") && !/^https?:\/\//i.test(value) && !value.split("/").includes("..");
}

// Expects a CSV with header: name,description,price,image_url.
export function parseProductCsv(csv: string): ProductCsvParseResult {
  if (csv.length > MAX_CSV_BYTES) {
    throw new Error(`CSV exceeds maximum allowed size of ${MAX_CSV_BYTES} bytes`);
  }

  let rows: string[][];
  try {
    rows = parse(csv, { relax_column_count: true, skip_empty_lines: true, trim: true });
  } catch {
    throw new Error("CSV could not be parsed");
  }

  const [header, ...dataRows] = rows;
  if (!header || header.join(",") !== "name,description,price,image_url") {
    throw new Error("CSV header must be: name,description,price,image_url");
  }

  if (dataRows.length > MAX_PRODUCT_ROWS) {
    throw new Error(`CSV exceeds maximum allowed rows of ${MAX_PRODUCT_ROWS}`);
  }

  const products: NewProduct[] = [];
  const errors: ProductCsvError[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const [rawName, rawDescription, rawPrice, rawImageUrl] = row;

    if (row.length !== 4 || rawName === undefined || rawDescription === undefined || rawPrice === undefined || rawImageUrl === undefined) {
      errors.push({ row: rowNumber, message: "must contain exactly four fields" });
      return;
    }

    const nameError = validateField(rawName, "name");
    const descriptionError = validateField(rawDescription, "description");
    const imageUrlError = validateField(rawImageUrl, "image_url");
    const priceText = rawPrice.trim();
    const price = Number(priceText);

    if (nameError || descriptionError || imageUrlError || !priceText || !Number.isFinite(price) || price < 0 || price > MAX_PRICE || !isValidStorageKey(rawImageUrl.trim())) {
      errors.push({
        row: rowNumber,
        message: nameError ?? descriptionError ?? imageUrlError ?? (!isValidStorageKey(rawImageUrl.trim()) ? "image_url must be a relative R2 storage key" : "price must be a valid non-negative number"),
      });
      return;
    }

    products.push({ name: rawName.trim(), description: rawDescription.trim(), price, storageKey: rawImageUrl.trim() });
  });

  return { products, errors };
}
