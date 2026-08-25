import Link from "next/link";
import { getSession } from "@/lib/session";
import { getCartItems } from "@/services/cartService";
import CartList from "@/components/CartList";

export default async function CartPage() {
  const session = await getSession();

  if (!session) {
    return <h1>Please login to view your cart</h1>;
  }

  const products = await getCartItems(session.userId);

  return (
    <main>
      <nav>
        <Link href="/products">Continue Shopping</Link>
      </nav>

      <CartList products={products} />
    </main>
  );
}