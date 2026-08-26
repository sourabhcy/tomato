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
    <button onClick={handleRemove} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2">
      Remove from Cart
    </button>
  );
}
