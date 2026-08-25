import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import ProductList from "@/components/ProductList";
import getProducts from "@/services/productService";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main>
      <h1>Products</h1>

      <nav>
        <Link href="/cart">Go to Cart</Link>
        <LogoutButton />
      </nav>

      <ProductList products={products} />
    </main>
  );
}