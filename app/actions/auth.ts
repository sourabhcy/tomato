"use server";

import { cookies } from "next/headers";
import { createSession } from "@/lib/session";
import authenticateUser from "@/services/authservice";

export async function login(email: string, password: string) {
 
  const user = await authenticateUser(email,password);

  if (!user) {
    return { success: false, message: "Invalid email or password" };
  }


  const token = await createSession(user.id, user.role);

  const cookieStore = await cookies();

  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return { success: true };
}

export async function logout() {
  const cookieStore = await cookies();

  cookieStore.delete("session");
}