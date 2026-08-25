import pool from "@/db/pool";
import AddToCartButton from "@/app/components/AddToCartButton";

export default async function ProductsPage() {
    
    const result = await pool.query(`
        SELECT id, name,description, price
        FROM products
        ORDER BY created_at DESC
        limit 10
    `);
    const products = result.rows;
  return (
    <main>
      <h1>Products</h1>

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