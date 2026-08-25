
import { getSession } from "@/lib/session";
import RemoveFromCartButton from "@/components/RemoveFromCartButton";
import { getCartItems } from "@/services/cartService";

export default async function CartPage() {
  const session = await getSession();

  if (!session) {
    return <h1>Please login to view your cart</h1>;
  }

    const products = await getCartItems(session.userId);

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