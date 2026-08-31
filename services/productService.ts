import pool from "@/db/pool";

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  thumbnailUrl: string | null;
  thumbnailWidth: number | null;
  thumbnailHeight: number | null;
};

export type ProductImage = {
  url: string;
  position: number;
  width: number | null;
  height: number | null;
};

export type ProductDetail = Product & { images: ProductImage[] };

type ProductRow = Omit<Product, "thumbnailUrl" | "thumbnailWidth" | "thumbnailHeight"> & {
  thumbnail_key: string | null;
  thumbnail_width: number | null;
  thumbnail_height: number | null;
};

type ProductDetailRow = Omit<ProductRow, "thumbnail_key" | "thumbnail_width" | "thumbnail_height"> & {
  image_key: string | null;
  image_position: number | null;
  image_width: number | null;
  image_height: number | null;
};

const PRODUCT_COLUMNS = "p.id, p.name, p.description, p.price";

export function buildImageUrl(storageKey: string | null) {
  if (!storageKey) return null;
  return `${process.env.R2_PUBLIC_BASE_URL}/${storageKey}`;
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    thumbnailUrl: buildImageUrl(row.thumbnail_key),
    thumbnailWidth: row.thumbnail_width,
    thumbnailHeight: row.thumbnail_height,
  };
}

export async function getProductCount() {
  const result = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM products"
  );

  return Number(result.rows[0]?.count ?? 0);
}

export async function getProductPage(offset: number, limit: number) {
  const result = await pool.query<ProductRow>(
    `
      SELECT ${PRODUCT_COLUMNS}, pi.storage_key AS thumbnail_key,
        pi.width AS thumbnail_width, pi.height AS thumbnail_height
      FROM products p
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.position = 0
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

  return result.rows.map(mapProduct);
}

export async function getProductById(productId: number): Promise<ProductDetail | null> {
  const result = await pool.query<ProductDetailRow>(
    `
      SELECT ${PRODUCT_COLUMNS}, pi.storage_key AS image_key, pi.position AS image_position,
        pi.width AS image_width, pi.height AS image_height
      FROM products p
      LEFT JOIN product_images pi ON pi.product_id = p.id
      WHERE p.id = $1
      ORDER BY pi.position ASC
    `,
    [productId]
  );

  const [product] = result.rows;
  if (!product) return null;

  return {
    ...mapProduct({ ...product, thumbnail_key: null, thumbnail_width: null, thumbnail_height: null }),
    images: result.rows.flatMap((row) => row.image_key === null || row.image_position === null ? [] : [{
      url: buildImageUrl(row.image_key)!, position: row.image_position, width: row.image_width, height: row.image_height,
    }]),
  };
}

export type NewProduct = {
  name: string;
  description: string;
  price: number;
  storageKey: string;
};

// Inserts a fresh batch of products to update the inventory; existing products are left untouched.
export async function bulkInsertProducts(products: NewProduct[]) {
  if (products.length === 0) {
    return 0;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const product of products) {
      const insertedProduct = await client.query<{ id: number }>(
        "INSERT INTO products (name, description, price) VALUES ($1, $2, $3) RETURNING id",
        [product.name, product.description, product.price]
      );
      await client.query(
        "INSERT INTO product_images (product_id, storage_key, position) VALUES ($1, $2, 0)",
        [insertedProduct.rows[0].id, product.storageKey]
      );
    }
    await client.query("COMMIT");
    return products.length;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

