import pool from "@/db/pool";

export async function addItemToCart(userId:number,productId:number){

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

export async function removeItemFromCart(userId:number,productId:number){
  await pool.query(
    `
    DELETE FROM cart_items
    WHERE user_id = $1
      AND product_id = $2
    `,
    [userId, productId]
  );
}

export async function getCartProductIds(userId: number) {
  const result = await pool.query<{ product_id: number }>(
    "SELECT product_id FROM cart_items WHERE user_id = $1",
    [userId]
  );

  return result.rows.map(({ product_id }) => product_id);
}

export async function getCartItems(userId: number) {
  const result = await pool.query(
    `
    SELECT
      products.id,
      products.name,
      products.description,
      products.price
    FROM cart_items
    INNER JOIN products
      ON products.id = cart_items.product_id
    WHERE cart_items.user_id = $1
    ORDER BY cart_items.created_at DESC
    `,
    [userId]
  );

  return result.rows;
}
