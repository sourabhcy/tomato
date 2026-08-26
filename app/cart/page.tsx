import Link from "next/link";
import { getSession } from "@/lib/session";
import { getCartItems } from "@/services/cartService";
import CartList from "@/components/CartList";

export default async function CartPage() {
  const session = await getSession();

  if (!session) {
    return <main className="grid min-h-screen place-items-center p-6"><p className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 font-medium text-amber-900">Please log in to view your cart.</p></main>;
  }

  const products = await getCartItems(session.userId);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-8">
        <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800">
          <span aria-hidden="true">←</span> Continue shopping
        </Link>
      </nav>

      <CartList products={products} />
    </main>
  );
}
