import RemoveFromCartButton from "./RemoveFromCartButton";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
};

export default function CartList({
  products,
}: {
  products: Product[];
}) {
  return (
    <section>
      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Your order</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Shopping cart</h1>
        <p className="mt-2 text-slate-600">{products.length} {products.length === 1 ? "item" : "items"} ready for checkout.</p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Your cart is empty.</p>
          <p className="mt-2 text-slate-600">Find something you love in the catalog.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map((product) => (
            <li className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between" key={product.id}>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-slate-950">{product.name}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">{product.description}</p>
                <span className="mt-3 block text-lg font-bold text-slate-950">
                  ${product.price}
                </span>
              </div>

              <RemoveFromCartButton productId={product.id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
