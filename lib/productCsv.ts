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

// Expects a CSV with header: name,description,price,image_150_key,image_500_key,image_1200_key.
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
  if (!header || header.join(",") !== "name,description,price,image_150_key,image_500_key,image_1200_key") {
    throw new Error("CSV header must be: name,description,price,image_150_key,image_500_key,image_1200_key");
  }

  if (dataRows.length > MAX_PRODUCT_ROWS) {
    throw new Error(`CSV exceeds maximum allowed rows of ${MAX_PRODUCT_ROWS}`);
  }

  const products: NewProduct[] = [];
  const errors: ProductCsvError[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const [rawName, rawDescription, rawPrice, rawImage150Key, rawImage500Key, rawImage1200Key] = row;

    if (row.length !== 6 || rawName === undefined || rawDescription === undefined || rawPrice === undefined || rawImage150Key === undefined || rawImage500Key === undefined || rawImage1200Key === undefined) {
      errors.push({ row: rowNumber, message: "must contain exactly six fields" });
      return;
    }

    const nameError = validateField(rawName, "name");
    const descriptionError = validateField(rawDescription, "description");
    const image150KeyError = validateField(rawImage150Key, "image_150_key");
    const image500KeyError = validateField(rawImage500Key, "image_500_key");
    const image1200KeyError = validateField(rawImage1200Key, "image_1200_key");
    const priceText = rawPrice.trim();
    const price = Number(priceText);
    const imageKeys = [rawImage150Key, rawImage500Key, rawImage1200Key].map((key) => key.trim());

    if (nameError || descriptionError || image150KeyError || image500KeyError || image1200KeyError || !priceText || !Number.isFinite(price) || price < 0 || price > MAX_PRICE || imageKeys.some((key) => !isValidStorageKey(key))) {
      errors.push({
        row: rowNumber,
        message: nameError ?? descriptionError ?? image150KeyError ?? image500KeyError ?? image1200KeyError ?? (imageKeys.some((key) => !isValidStorageKey(key)) ? "image keys must be relative R2 storage keys" : "price must be a valid non-negative number"),
      });
      return;
    }

    products.push({
      name: rawName.trim(),
      description: rawDescription.trim(),
      price,
      images: [
        { storageKey: imageKeys[0], position: 0, width: 150, height: 150 },
        { storageKey: imageKeys[1], position: 1, width: 500, height: 500 },
        { storageKey: imageKeys[2], position: 2, width: 1200, height: 1200 },
      ],
    });
  });

  return { products, errors };
}
