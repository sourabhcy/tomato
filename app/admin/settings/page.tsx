import Link from "next/link";
import { getSession } from "@/lib/session";
import AddUserForm from "@/components/AddUserForm";
import ProductUploadForm from "@/components/ProductUploadForm";

export default async function AdminSettingsPage() {
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

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-8">
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800">
          <span aria-hidden="true">←</span> Back to users
        </Link>
      </nav>

      <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-950">Configuration</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        <AddUserForm />
        <ProductUploadForm />
      </div>
    </main>
  );
}
