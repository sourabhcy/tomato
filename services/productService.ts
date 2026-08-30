import pool from "@/db/pool";

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
};

const PRODUCT_COLUMNS = "id, name, description, price";

export async function getProductCount() {
  const result = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM products"
  );

  return Number(result.rows[0]?.count ?? 0);
}

export async function getProductPage(offset: number, limit: number) {
  const result = await pool.query<Product>(
    `
      SELECT ${PRODUCT_COLUMNS}
      FROM products
      ORDER BY created_at DESC, id DESC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

  return result.rows;
}

export type NewProduct = {
  name: string;
  description: string;
  price: number;
};

// Inserts a fresh batch of products to update the inventory; existing products are left untouched.
export async function bulkInsertProducts(products: NewProduct[]) {
  if (products.length === 0) {
    return 0;
  }

  const values: string[] = [];
  const params: unknown[] = [];

  products.forEach((product, index) => {
    const base = index * 3;
    values.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
    params.push(product.name, product.description, product.price);
  });

  const result = await pool.query(
    `INSERT INTO products (name, description, price) VALUES ${values.join(", ")}`,
    params
  );

  return result.rowCount ?? 0;
}

