"use client";

import { removeFromCart } from "@/app/actions/cart";

export default function RemoveFromCartButton({
  productId,
}: {
  productId: number;
}) {
  async function handleRemove() {
    await removeFromCart(productId);
    window.location.reload();
  }

  return (
    <button onClick={handleRemove}>
      Remove from Cart
    </button>
  );
}