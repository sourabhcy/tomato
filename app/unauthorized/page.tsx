import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-center">
        <h1 className="text-xl font-bold text-rose-900">Not authorized</h1>
        <p className="mt-2 text-rose-800">You are not authorized to perform this operation.</p>
        <Link href="/products" className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-800">
          Back to products
        </Link>
      </div>
    </main>
  );
}
