"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import AddToCartButton from "./AddToCartButton";
import { buildSrcSet, getLargestImageSource } from "../lib/responsiveImage";
import type { Product } from "@/services/productService";

const PAGE_SIZE = 100;
const MAX_CACHED_PAGES = 30;
const CARD_HEIGHT = 260;
const GRID_GAP = 24;
const MIN_CARD_WIDTH = 250;
const OVERSCAN_ROWS = 3;

type Viewport = { width: number; height: number; scrollTop: number };

const ProductCard = memo(function ProductCard({ product, isInCart, onCartChange }: {
  product?: Product;
  isInCart: boolean;
  onCartChange: (productId: number, isInCart: boolean) => void;
}) {
  if (!product) return <div aria-hidden="true" className="h-[260px] min-w-0 animate-pulse rounded-2xl bg-slate-200" />;
  const imageSources = product.imageSources;
  const fallbackImage = getLargestImageSource(imageSources);

  return (
    <article className="flex h-[260px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex h-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
        {fallbackImage ? (
          <img
            src={fallbackImage.url}
            srcSet={buildSrcSet(imageSources)}
            sizes="(max-width: 640px) 150px, (max-width: 1024px) 500px, 1200px"
            alt={product.name}
            width={fallbackImage.width}
            height={fallbackImage.height ?? fallbackImage.width}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />
        ) : <div aria-label="No product image available" className="h-full w-full bg-slate-200" role="img" />}
      </div>
      <h2 className="truncate text-lg font-semibold text-slate-950">{product.name}</h2>
      <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">{product.description}</p>
      <strong className="mt-auto mb-3 block text-xl font-bold tracking-tight text-slate-950">${product.price}</strong>
      <AddToCartButton productId={product.id} isInCart={isInCart} onCartChange={onCartChange} />
    </article>
  );
});

export default function ProductList({ initialProducts, productCount, initialCartProductIds }: {
  initialProducts: Product[];
  productCount: number;
  initialCartProductIds: number[];
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef(new Map<number, Product[]>([[0, initialProducts]]));
  const pendingPagesRef = useRef(new Set<number>());
  const frameRef = useRef<number | undefined>(undefined);
  const [pageCache, setPageCache] = useState(() => new Map<number, Product[]>([[0, initialProducts]]));
  const [cartProductIds, setCartProductIds] = useState(() => new Set(initialCartProductIds));
  const [loadError, setLoadError] = useState(false);
  const [viewport, setViewport] = useState<Viewport>({ width: 0, height: 600, scrollTop: 0 });

  const columns = Math.max(1, Math.floor((viewport.width + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP)));
  const rowHeight = CARD_HEIGHT + GRID_GAP;
  const rowCount = Math.ceil(productCount / columns);
  const firstVisibleRow = Math.max(0, Math.floor(viewport.scrollTop / rowHeight) - OVERSCAN_ROWS);
  const lastVisibleRow = Math.min(rowCount, Math.ceil((viewport.scrollTop + viewport.height) / rowHeight) + OVERSCAN_ROWS);
  const startIndex = firstVisibleRow * columns;
  const endIndex = Math.min(productCount, lastVisibleRow * columns);

  const loadPage = useCallback(async (page: number) => {
    if (pagesRef.current.has(page) || pendingPagesRef.current.has(page)) return;
    pendingPagesRef.current.add(page);
    try {
      const response = await fetch(`/api/products?offset=${page * PAGE_SIZE}&limit=${PAGE_SIZE}`);
      if (!response.ok) throw new Error("Unable to load products");
      const products: Product[] = await response.json();
      pagesRef.current.set(page, products);
      while (pagesRef.current.size > MAX_CACHED_PAGES) {
        const oldestPage = pagesRef.current.keys().next().value;
        if (oldestPage === undefined || oldestPage === page) break;
        pagesRef.current.delete(oldestPage);
      }
      setLoadError(false);
      setPageCache(new Map(pagesRef.current));
    } catch {
      setLoadError(true);
    } finally {
      pendingPagesRef.current.delete(page);
    }
  }, []);

  const handleCartChange = useCallback((productId: number, isInCart: boolean) => {
    setCartProductIds((current) => {
      const next = new Set(current);
      if (isInCart) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (startIndex >= endIndex) return;
    const firstPage = Math.floor(startIndex / PAGE_SIZE);
    const lastPage = Math.floor((endIndex - 1) / PAGE_SIZE);
    const timeout = window.setTimeout(() => {
      for (let page = firstPage; page <= lastPage; page += 1) void loadPage(page);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [endIndex, loadPage, startIndex]);

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const updateDimensions = () => {
      setViewport((current) => ({ ...current, width: element.clientWidth, height: element.clientHeight }));
    };
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(element);
    updateDimensions();
    return () => observer.disconnect();
  }, []);

  const handleScroll = () => {
    if (frameRef.current !== undefined) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = undefined;
      const scrollTop = viewportRef.current?.scrollTop ?? 0;
      setViewport((current) => (current.scrollTop === scrollTop ? current : { ...current, scrollTop }));
    });
  };

  useEffect(() => () => {
    if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
  }, []);

  if (productCount === 0) return <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-slate-600">No products are available.</p>;

  return (
    <section aria-label="Products">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">{productCount.toLocaleString()} products</p>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Virtualized catalog</span>
      </div>
      {loadError && <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" role="status">Some products could not be loaded. Scroll again to retry.</p>}
      <div className="h-[min(72vh,760px)] min-h-[420px] overflow-auto rounded-2xl border border-slate-200 bg-slate-100/70 p-3 shadow-inner" onScroll={handleScroll} ref={viewportRef}>
        <div className="relative min-h-px" style={{ height: rowCount * rowHeight - GRID_GAP }}>
          <div className="absolute right-0 left-0 grid gap-6" style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            transform: `translate3d(0, ${firstVisibleRow * rowHeight}px, 0)`,
          }}>
            {Array.from({ length: endIndex - startIndex }, (_, offset) => {
              const index = startIndex + offset;
              const page = Math.floor(index / PAGE_SIZE);
              const product = pageCache.get(page)?.[index % PAGE_SIZE];
              return <ProductCard key={product?.id ?? index} product={product} isInCart={product ? cartProductIds.has(product.id) : false} onCartChange={handleCartChange} />;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
