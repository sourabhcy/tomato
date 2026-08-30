import Link from "next/link";
import { getSessionWithPermission } from "@/lib/authorize";
import { canManage } from "@/lib/rbac";
import AddUserForm from "@/components/AddUserForm";
import ProductUploadForm from "@/components/ProductUploadForm";
import Unauthorized from "@/components/Unauthorized";

export default async function AdminSettingsPage() {
  const session = await getSessionWithPermission("admin:view");

  if (!session) {
    return <Unauthorized />;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-8">
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800">
          <span aria-hidden="true">←</span> Back to users
        </Link>
      </nav>

      <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-950">Configuration</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        {canManage(session.role, "users") && <AddUserForm />}
        {canManage(session.role, "products") && <ProductUploadForm />}
      </div>
    </main>
  );
}
