import type { ProductImageSource } from "@/services/productService";

export function buildSrcSet(imageSources: ProductImageSource[]) {
  return imageSources.map((source) => `${source.url} ${source.width}w`).join(", ");
}

export function getLargestImageSource(imageSources: ProductImageSource[]) {
  return imageSources.reduce<ProductImageSource | undefined>(
    (largest, image) => !largest || image.width > largest.width ? image : largest,
    undefined
  );
}