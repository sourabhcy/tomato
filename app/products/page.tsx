import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import ProductList from "@/components/ProductList";
import { getProductCount, getProductPage } from "@/services/productService";
import { getCartProductIds } from "@/services/cartService";
import { getSession } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

const INITIAL_PAGE_SIZE = 100;

export default async function ProductsPage() {
  const session = await getSession();
  const [productCount, initialProducts, cartProductIds] = await Promise.all([
    getProductCount(),
    getProductPage(0, INITIAL_PAGE_SIZE),
    session ? getCartProductIds(session.userId) : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Northstar Market
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Discover products</h1>
          <p className="mt-2 max-w-xl text-slate-600">Browse the catalog without slowing down your shopping.</p>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/cart" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            View cart
          </Link>
          {hasPermission(session?.role, "admin:view") && (
            <Link href="/admin/users" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Admin
          </Link>
          )}
        <LogoutButton />
        </nav>
      </header>

      <ProductList
        initialProducts={initialProducts}
        productCount={productCount}
        initialCartProductIds={cartProductIds}
      />
    </main>
  );
}
