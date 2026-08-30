import Link from "next/link";
import { getSession } from "@/lib/session";
import { getAllUsers } from "@/services/userService";
import UserList from "@/components/UserList";
import AddUserForm from "@/components/AddUserForm";

export default async function AdminUsersPage() {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 font-medium text-rose-900">
          You are not authorized to perform this operation.
        </p>
      </main>
    );
  }

  const users = await getAllUsers();

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-8 flex items-center justify-between">
        <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800">
          <span aria-hidden="true">←</span> Back to products
        </Link>
        <Link href="/admin/settings" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
          Configuration
        </Link>
      </nav>

      <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-950">Users</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        <UserList users={users} />
        <AddUserForm />
      </div>
    </main>
  );
}
