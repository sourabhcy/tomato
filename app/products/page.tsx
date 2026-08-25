
import AddToCartButton from "@/components/AddToCartButton";
import getProducts from "@/services/productService";
import Link from "next/link";

export default async function ProductsPage() {
    const products = await getProducts();
  return (
    <main>
      <h1>Products</h1>
    <Link href="/cart">Go to Cart</Link>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <p>${product.price}</p>
             <AddToCartButton productId={product.id}/>
          </li>
        ))}
      </ul>
    </main>
  );
}