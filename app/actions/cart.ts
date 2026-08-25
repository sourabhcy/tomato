"use server";

import pool from "@/db/pool";

export async function addToCart(productId: number, userId: number) {
  await pool.query(
   `
      INSERT INTO cart_items (user_id, product_id)
      SELECT $1, id FROM products WHERE id = $2
      ON CONFLICT (user_id, product_id) DO NOTHING
      RETURNING id
    `,
    
    [userId, productId]
  );
}