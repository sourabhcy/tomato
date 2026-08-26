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
