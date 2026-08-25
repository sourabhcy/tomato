import pool from "@/db/pool";
import { getSession } from "@/lib/session";
import RemoveFromCartButton from "@/app/components/RemoveFromCartButton";

export default async function CartPage() {
  const session = await getSession();

  if (!session) {
    return <h1>Please login to view your cart</h1>;
  }

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
    [session.userId]
  );

  const products = result.rows;

  return (
    <main>
      <h1>Your Cart</h1>

      {products.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <ul>
          {products.map((product) => (
            <li key={product.id}>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <p>${product.price}</p>
              <RemoveFromCartButton productId={product.id} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}