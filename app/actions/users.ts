"use server";

import { requireAdmin } from "@/lib/authorize";
import { getAllUsers, createSubUser, deleteUser } from "@/services/userService";

export async function listUsers() {
  await requireAdmin();

  return getAllUsers();
}

export async function addSubUser(name: string, email: string, password: string) {
  await requireAdmin();

  return createSubUser(name, email, password);
}

export async function removeUser(userId: number) {
  await requireAdmin();

  return deleteUser(userId);
}
