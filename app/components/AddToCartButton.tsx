"use client";
import { addToCart } from "@/app/actions/cart";

interface AddToCartButtonProps {
  productId: number;
  userId: number;
}

export default function AddToCartButton({
    productId,userId
}:AddToCartButtonProps) {
  
  async function handleAddToCart() {
    await addToCart(productId, userId);
  }

  return (
    <button onClick={handleAddToCart}>
      Add to Cart
    </button>
  );
}