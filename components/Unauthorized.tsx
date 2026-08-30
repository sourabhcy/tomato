export default function Unauthorized() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <p className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 font-medium text-rose-900">
        You are not authorized to perform this operation.
      </p>
    </main>
  );
}
