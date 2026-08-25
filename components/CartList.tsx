import RemoveFromCartButton from "./RemoveFromCartButton";
import styles from "./CartList.module.css";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
};

export default function CartList({
  products,
}: {
  products: Product[];
}) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Your Cart</h1>
      </div>

      {products.length === 0 ? (
        <div className={styles.empty}>
          <p>Your cart is empty.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {products.map((product) => (
            <li className={styles.item} key={product.id}>
              <div className={styles.details}>
                <h2>{product.name}</h2>
                <p className={styles.description}>
                  {product.description}
                </p>
                <span className={styles.price}>
                  ${product.price}
                </span>
              </div>

              <RemoveFromCartButton productId={product.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}