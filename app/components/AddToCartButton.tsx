"use client";
import { addToCart } from "@/app/actions/cart";

interface AddToCartButtonProps {
  productId: number;
}

export default function AddToCartButton({
    productId
}:AddToCartButtonProps) {
  
  async function handleAddToCart() {
    await addToCart(productId);
  }

  return (
    <button onClick={handleAddToCart}>
      Add to Cart
    </button>
  );
}