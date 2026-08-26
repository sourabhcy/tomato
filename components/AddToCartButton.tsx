"use client";
import { addToCart, removeFromCart } from "@/app/actions/cart";

interface AddToCartButtonProps {
  productId: number;
  isInCart: boolean;
  onCartChange: (productId: number, isInCart: boolean) => void;
}

export default function AddToCartButton({
  productId,
  isInCart,
  onCartChange,
}:AddToCartButtonProps) {
  async function handleAddToCart() {
    await addToCart(productId);
    onCartChange(productId, true);
  }

  async function handleRemoveFromCart() {
    await removeFromCart(productId);
    onCartChange(productId, false);
  }

  return (
    <div className="flex gap-2">
      <button
        aria-pressed={isInCart}
        className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-default disabled:bg-emerald-600"
        disabled={isInCart}
        onClick={handleAddToCart}
      >
        {isInCart ? "Added" : "Add to Cart"}
      </button>
      {isInCart && (
        <button
          aria-label="Remove from cart"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          onClick={handleRemoveFromCart}
        >
          Remove
        </button>
      )}
    </div>
  );
}
