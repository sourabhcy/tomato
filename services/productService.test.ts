import pool from "@/db/pool";
import { buildImageUrl, getProductById, getProductPage } from "./productService";

jest.mock("@/db/pool", () => ({ query: jest.fn() }));

const mockQuery = jest.mocked(pool.query);

describe("productService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.R2_PUBLIC_BASE_URL = "https://images.example.test";
  });

  it("builds an image URL only when a storage key is present", () => {
    expect(buildImageUrl("products/1/thumb.webp")).toBe("https://images.example.test/products/1/thumb.webp");
    expect(buildImageUrl(null)).toBeNull();
  });

  it("returns page products with responsive image sources", async () => {
    mockQuery.mockResolvedValue({
      rows: [{
        id: 1,
        name: "Keyboard",
        description: "Mechanical keyboard",
        price: 99,
        image_sources: [
          { storageKey: "products/1/thumb.webp", width: 150, height: 150 },
          { storageKey: "products/1/medium.webp", width: 500, height: 500 },
          { storageKey: "products/1/large.webp", width: 1200, height: 1200 },
        ],
      }],
    } as never);

    await expect(getProductPage(20, 10)).resolves.toEqual([{
      id: 1,
      name: "Keyboard",
      description: "Mechanical keyboard",
      price: 99,
      imageSources: [
        { url: "https://images.example.test/products/1/thumb.webp", width: 150, height: 150 },
        { url: "https://images.example.test/products/1/medium.webp", width: 500, height: 500 },
        { url: "https://images.example.test/products/1/large.webp", width: 1200, height: 1200 },
      ],
    }]);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("LEFT JOIN product_images pi"),
      [10, 20]
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("jsonb_agg"),
      [10, 20]
    );
  });

  it("returns a product detail with image variants in database order", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: 1,
          name: "Keyboard",
          description: "Mechanical keyboard",
          price: 99,
          image_key: "products/1/thumb.webp",
          image_position: 0,
          image_width: 320,
          image_height: 180,
        },
        {
          id: 1,
          name: "Keyboard",
          description: "Mechanical keyboard",
          price: 99,
          image_key: "products/1/large.webp",
          image_position: 2,
          image_width: 1200,
          image_height: 675,
        },
      ],
    } as never);

    await expect(getProductById(1)).resolves.toEqual({
      id: 1,
      name: "Keyboard",
      description: "Mechanical keyboard",
      price: 99,
      imageSources: [],
      images: [
        { url: "https://images.example.test/products/1/thumb.webp", position: 0, width: 320, height: 180 },
        { url: "https://images.example.test/products/1/large.webp", position: 2, width: 1200, height: 675 },
      ],
    });
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("ORDER BY pi.position ASC"), [1]);
  });
});