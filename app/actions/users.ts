"use server";

import { requirePermission } from "@/lib/authorize";
import { getAllUsers, createSubUser, deleteUser } from "@/services/userService";

export async function listUsers() {
  await requirePermission("users:manage");

  return getAllUsers();
}

export async function addSubUser(name: string, email: string, password: string) {
  await requirePermission("users:manage");

  return createSubUser(name, email, password);
}

export async function removeUser(userId: number) {
  await requirePermission("users:manage");

  return deleteUser(userId);
}
