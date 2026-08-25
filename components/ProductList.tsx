import AddToCartButton from "./AddToCartButton";
import styles from "./ProductList.module.css";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
};

export default function ProductList({
  products,
}: {
  products: Product[];
}) {
  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <div className={styles.card} key={product.id}>
          <h2>{product.name}</h2>

          <p>{product.description}</p>

          <strong>${product.price}</strong>

          <AddToCartButton productId={product.id} />
        </div>
      ))}
    </div>
  );
}