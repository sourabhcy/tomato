"use server";

import { requirePermission } from "@/lib/authorize";
import { MAX_CSV_BYTES, parseProductCsv } from "@/lib/productCsv";
import { bulkInsertProducts } from "@/services/productService";

export async function uploadProductList(formData: FormData) {
  await requirePermission("products:manage");

  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("No file uploaded");
  }

  // Check size before reading content, so an oversized file is never buffered into memory.
  if (file.size > MAX_CSV_BYTES) {
    throw new Error(`File exceeds maximum allowed size of ${MAX_CSV_BYTES} bytes`);
  }

  const csv = await file.text();
  const products = parseProductCsv(csv);

  const inserted = await bulkInsertProducts(products);

  return { inserted };
}
