import pool from "@/db/pool";
import { buildImageUrl } from "./productService";

type CartItemRow = {
  id: number;
  name: string;
  description: string;
  price: number;
  thumbnail_key: string | null;
  thumbnail_width: number | null;
  thumbnail_height: number | null;
};

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
  const result = await pool.query<CartItemRow>(
    `
    SELECT
      products.id,
      products.name,
      products.description,
      products.price,
      product_images.storage_key AS thumbnail_key,
      product_images.width AS thumbnail_width,
      product_images.height AS thumbnail_height
    FROM cart_items
    INNER JOIN products
      ON products.id = cart_items.product_id
    LEFT JOIN product_images
      ON product_images.product_id = products.id AND product_images.position = 0
    WHERE cart_items.user_id = $1
    ORDER BY cart_items.created_at DESC
    `,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    thumbnailUrl: buildImageUrl(row.thumbnail_key),
    thumbnailWidth: row.thumbnail_width,
    thumbnailHeight: row.thumbnail_height,
  }));
}
