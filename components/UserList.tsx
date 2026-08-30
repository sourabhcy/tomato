"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeUser } from "@/app/actions/users";
import type { SubUser } from "@/services/userService";

export default function UserList({ users, canManage }: { users: SubUser[]; canManage: boolean }) {
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleDelete(userId: number) {
    setMessage("");

    try {
      await removeUser(userId);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete user");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {message && (
        <p className="rounded-t-2xl bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700">{message}</p>
      )}
      <ul className="divide-y divide-slate-200">
        {users.map((user) => (
          <li key={user.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-semibold text-slate-950">{user.name}</p>
              <p className="text-sm text-slate-600">{user.email}</p>
              <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                {user.role}
              </span>
            </div>
            {canManage && user.role !== "admin" && (
              <button
                onClick={() => handleDelete(user.id)}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
