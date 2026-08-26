"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import AddToCartButton from "./AddToCartButton";
import styles from "./ProductList.module.css";
import type { Product } from "@/services/productService";

const PAGE_SIZE = 100;
const MAX_CACHED_PAGES = 30;
const CARD_HEIGHT = 260;
const GRID_GAP = 24;
const MIN_CARD_WIDTH = 250;
const OVERSCAN_ROWS = 3;

type Viewport = { width: number; height: number; scrollTop: number };

const ProductCard = memo(function ProductCard({ product }: { product?: Product }) {
  if (!product) return <div aria-hidden="true" className={`${styles.card} ${styles.placeholder}`} />;

  return (
    <article className={styles.card}>
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <strong>${product.price}</strong>
      <AddToCartButton productId={product.id} />
    </article>
  );
});

export default function ProductList({ initialProducts, productCount }: {
  initialProducts: Product[];
  productCount: number;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef(new Map<number, Product[]>([[0, initialProducts]]));
  const pendingPagesRef = useRef(new Set<number>());
  const frameRef = useRef<number | undefined>(undefined);
  const [pageCache, setPageCache] = useState(() => new Map<number, Product[]>([[0, initialProducts]]));
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

  if (productCount === 0) return <p>No products are available.</p>;

  return (
    <section aria-label="Products">
      <p className={styles.summary}>{productCount.toLocaleString()} products</p>
      {loadError && <p className={styles.error} role="status">Some products could not be loaded. Scroll again to retry.</p>}
      <div className={styles.viewport} onScroll={handleScroll} ref={viewportRef}>
        <div className={styles.spacer} style={{ height: rowCount * rowHeight - GRID_GAP }}>
          <div className={styles.grid} style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            transform: `translate3d(0, ${firstVisibleRow * rowHeight}px, 0)`,
          }}>
            {Array.from({ length: endIndex - startIndex }, (_, offset) => {
              const index = startIndex + offset;
              const page = Math.floor(index / PAGE_SIZE);
              const product = pageCache.get(page)?.[index % PAGE_SIZE];
              return <ProductCard key={product?.id ?? index} product={product} />;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
