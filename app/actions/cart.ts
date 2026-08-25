"use server";

import { getSession } from "@/lib/session";
import { addItemToCart,removeItemFromCart } from "@/services/cartService";

export async function addToCart(productId: number) {
  const session = await getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  return addItemToCart(session.userId,productId);

}


export async function removeFromCart(productId: number) {
  const session = await getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  return removeItemFromCart(session.userId,productId);
}