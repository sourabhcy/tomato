import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import ProductList from "@/components/ProductList";
import { getProductCount, getProductPage } from "@/services/productService";

const INITIAL_PAGE_SIZE = 100;

export default async function ProductsPage() {
  const [productCount, initialProducts] = await Promise.all([
    getProductCount(),
    getProductPage(0, INITIAL_PAGE_SIZE),
  ]);

  return (
    <main>
      <h1>Products</h1>

      <nav>
        <Link href="/cart">Go to Cart</Link>
        <LogoutButton />
      </nav>

      <ProductList
        initialProducts={initialProducts}
        productCount={productCount}
      />
    </main>
  );
}
