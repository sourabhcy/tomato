"use client";

import { useState } from "react";
import { uploadProductList } from "@/app/actions/products";
import { MAX_CSV_BYTES } from "@/lib/productCsv";

export default function ProductUploadForm() {
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file");

    // Reject oversized files before uploading, so the browser never attempts
    // to send (and the server never buffers) an excessively large payload.
    if (file instanceof File && file.size > MAX_CSV_BYTES) {
      setMessage(`File is too large. Maximum allowed size is ${MAX_CSV_BYTES / (1024 * 1024)}MB.`);
      return;
    }

    try {
      const result = await uploadProductList(formData);
      setMessage(`Inserted ${result.inserted} product(s).`);
      e.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to upload product list");
    }
  }

  return (
    <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
      <h2 className="text-lg font-bold text-slate-950">Update inventory</h2>
      <p className="text-sm text-slate-600">Upload a CSV with header: name,description,price</p>

      <input
        type="file"
        name="file"
        accept=".csv,text/csv"
        required
        className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-500"
      />

      <button
        type="submit"
        className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Upload
      </button>

      {message && (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">{message}</p>
      )}
    </form>
  );
}
