CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  position SMALLINT DEFAULT 0,
  width INT,
  height INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id, storage_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS product_images_product_storage_key_idx
  ON product_images (product_id, storage_key);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON product_images (product_id);