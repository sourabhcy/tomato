import Link from "next/link";
import { getSessionWithPermission } from "@/lib/authorize";
import { canManage } from "@/lib/rbac";
import { getAllUsers } from "@/services/userService";
import UserList from "@/components/UserList";
import AddUserForm from "@/components/AddUserForm";
import Unauthorized from "@/components/Unauthorized";

export default async function AdminUsersPage() {
  const session = await getSessionWithPermission("admin:view");

  if (!session) {
    return <Unauthorized />;
  }

  const users = await getAllUsers();
  const canManageUsers = canManage(session.role, "users");

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
        <UserList users={users} canManage={canManageUsers} />
        {canManageUsers && <AddUserForm />}
      </div>
    </main>
  );
}
