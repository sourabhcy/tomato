"use server";

import pool from "@/db/pool";
import { getSession } from "@/lib/session";

export async function addToCart(productId: number) {
  const session = await getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  await pool.query(
     `
      INSERT INTO cart_items (user_id, product_id)
      SELECT $1, id FROM products WHERE id = $2
      ON CONFLICT (user_id, product_id) DO NOTHING
      RETURNING id
    `,
    [session.userId, productId]
  );
}


export async function removeFromCart(productId: number) {
  const session = await getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  await pool.query(
    `
    DELETE FROM cart_items
    WHERE user_id = $1
      AND product_id = $2
    `,
    [session.userId, productId]
  );
}