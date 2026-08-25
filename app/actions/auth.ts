"use server";

import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import pool from "@/db/pool";
import { createSession } from "@/lib/session";

export async function login(email: string, password: string) {
  const result = await pool.query(
    `
    SELECT id, email,role, password_hash
    FROM users
    WHERE email = $1
    LIMIT 1
    `,
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    return { success: false, message: "Invalid email or password" };
  }

  const passwordMatch = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatch) {
    return { success: false, message: "Invalid email or password" };
  }

  const token = await createSession(user.id);

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