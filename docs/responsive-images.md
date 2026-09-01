# Responsive product image loading

## Purpose

This document records the responsive product-image incident, its root cause, and the controls that prevent a regression. Product images are served directly from the public R2 host configured by `R2_PUBLIC_BASE_URL`.

## Data contract

`product_images` is the source of truth. A product can have multiple rows, each with:

| Column | Purpose |
| --- | --- |
| `product_id` | Product relationship |
| `storage_key` | R2 path, such as `products/1/medium.webp` |
| `position` | Display ordering |
| `width` | Intrinsic image width in pixels |
| `height` | Intrinsic image height in pixels |

The standard product set has three R2 objects:

| Storage key | Width descriptor |
| --- | --- |
| `products/<id>/thumb.webp` | `150w` |
| `products/<id>/medium.webp` | `500w` |
| `products/<id>/large.webp` | `1200w` |

The service aggregates these database rows into `Product.imageSources`. The public API uses camel case:

```ts
type ProductImageSource = {
  url: string;
  width: number;
  height: number | null;
};
```

`url` is created only by `buildImageUrl(storageKey)`, which prefixes the key with `R2_PUBLIC_BASE_URL`. Do not introduce another image host, URL transformation service, or variant-specific API field.

## Incident summary

The product catalog repeatedly requested `medium.webp`, even when tested at mobile and desktop viewport widths.

The database rows and `srcSet` candidates were correct. The defect was the `sizes` value in the catalog image:

```html
sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
```

That value told the browser that the image could occupy a substantial portion of the viewport. The browser therefore calculated a candidate requirement near `500px` in the tested viewport ranges and selected the `500w` medium source.

## Root cause

`sizes` must describe the image's expected rendered width, not simply the column count of the surrounding grid. The catalog had a fixed-height image area but advertised broad viewport-relative widths. This created a mismatch between the browser's source-selection input and the intended variant policy.

The corrected catalog declaration maps the existing source set to viewport bands:

```html
sizes="(max-width: 640px) 150px, (max-width: 1024px) 500px, 1200px"
```

The browser combines `sizes` with the device pixel ratio (DPR). At DPR $1$, the expected fresh-load behavior is:

| Viewport | Selected candidate |
| --- | --- |
| `375px` | `150w` thumb |
| `800px` | `500w` medium |
| `1440px` | `1200w` large |

At higher DPR values, the browser can select a larger candidate. For example, a `$150px$` slot at DPR $2$ has an effective source requirement of approximately `$300px$`; with only `150w`, `500w`, and `1200w` available, `500w` is the correct choice. This is expected responsive-image behavior, not a fault.

## Current implementation

1. `getProductPage()` in [services/productService.ts](../services/productService.ts) aggregates `product_images` into ordered `image_sources` JSON.
2. `mapProduct()` converts each `storageKey` to a public R2 `url` and publishes `imageSources`.
3. [components/ProductList.tsx](../components/ProductList.tsx) constructs the native `srcSet` directly from `{ url, width, height }` values.
4. The browser selects the source at request time; application code does not choose thumb, medium, or large by filename or hard-coded condition.
5. [components/CartList.tsx](../components/CartList.tsx) uses the same source-list model for cart image previews.

## Mitigations and guardrails

- Keep `R2_PUBLIC_BASE_URL` as the sole image-host configuration.
- Treat `product_images.storage_key`, `width`, and `height` as authoritative. Do not infer dimensions from filenames.
- Return generic `imageSources`; do not add pseudo-columns such as `thumbnail_key`, `medium_key`, or `large_key`.
- Use `srcSet` with width descriptors from the database and a `sizes` string that represents the component's actual intended display width.
- Retain `src` as an accessible fallback. Use the largest available source as the fallback for non-`srcSet` clients.
- Keep `loading="lazy"` and `decoding="async"` for catalog and cart images.
- Do not use `next/image` unless the architecture changes to use Next's optimization pipeline. It cannot discover separate R2 variants automatically from a single URL.
- Update the CSV importer and its tests whenever the supported responsive source set changes. The current importer accepts `image_150_key`, `image_500_key`, and `image_1200_key` and writes their actual dimensions to `product_images`.

## Browser verification procedure

Use a new page load for each viewport. Resizing an already-loaded image does not guarantee that the browser will replace a previously fetched larger candidate with a smaller one.

1. Open `/products` in a browser with DevTools Network enabled.
2. Disable cache or open a new private browser context.
3. Set DPR to `1` for deterministic baseline verification.
4. Set viewport width to `375px`, reload, and inspect the first catalog image's `currentSrc`. Expect `thumb.webp`.
5. Set viewport width to `800px`, reload, and expect `medium.webp`.
6. Set viewport width to `1440px`, reload, and expect `large.webp`.
7. Repeat at DPR `2` and confirm that selecting a larger source is expected when the effective required width increases.

## Automated verification

Run the image data-flow tests after changes to the product query, mapping, importer, or image markup:

```bash
npm test -- --runTestsByPath services/productService.test.ts lib/productCsv.test.ts app/actions/products.test.ts
```

The tests verify that all stored image rows become public R2 URLs and that imports preserve the three image entries. Browser verification remains necessary because source selection is a browser algorithm that depends on viewport and DPR.