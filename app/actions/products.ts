"use server";

import { requireAdmin } from "@/lib/authorize";
import { bulkInsertProducts, type NewProduct } from "@/services/productService";

// Expects a CSV with header: name,description,price
function parseProductCsv(csv: string): NewProduct[] {
  const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const [, ...rows] = lines;

  return rows.map((row) => {
    const [name, description, price] = row.split(",").map((value) => value.trim());

    if (!name || !description || !price || Number.isNaN(Number(price))) {
      throw new Error(`Invalid product row: "${row}"`);
    }

    return { name, description, price: Number(price) };
  });
}

export async function uploadProductList(formData: FormData) {
  await requireAdmin();

  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("No file uploaded");
  }

  const csv = await file.text();
  const products = parseProductCsv(csv);

  const inserted = await bulkInsertProducts(products);

  return { inserted };
}
