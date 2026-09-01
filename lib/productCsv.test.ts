import { MAX_CSV_BYTES, MAX_PRODUCT_ROWS, parseProductCsv } from "./productCsv";

const HEADER = "name,description,price,image_150_key,image_500_key,image_1200_key";
const imageKeys = (product: string) => `products/${product}/thumb.webp,products/${product}/medium.webp,products/${product}/large.webp`;
const productImages = (product: string) => [
  { storageKey: `products/${product}/thumb.webp`, position: 0, width: 150, height: 150 },
  { storageKey: `products/${product}/medium.webp`, position: 1, width: 500, height: 500 },
  { storageKey: `products/${product}/large.webp`, position: 2, width: 1200, height: 1200 },
];

describe("parseProductCsv", () => {
  it("parses valid rows, skipping the header", () => {
    const result = parseProductCsv(`${HEADER}\nMouse,A mouse,9.99,${imageKeys("mouse")}\nKeyboard,A keyboard,19.99,${imageKeys("keyboard")}`);

    expect(result).toEqual({
      products: [
        { name: "Mouse", description: "A mouse", price: 9.99, images: productImages("mouse") },
        { name: "Keyboard", description: "A keyboard", price: 19.99, images: productImages("keyboard") },
      ],
      errors: [],
    });
  });

  it("ignores blank lines", () => {
    const result = parseProductCsv(`${HEADER}\n\nMouse,A mouse,9.99,${imageKeys("mouse")}\n\n`);

    expect(result).toEqual({
      products: [{ name: "Mouse", description: "A mouse", price: 9.99, images: productImages("mouse") }],
      errors: [],
    });
  });

  it("reports row-level validation errors while retaining valid rows", () => {
    const result = parseProductCsv(`${HEADER}\nMouse,,9.99,${imageKeys("mouse")}\nKeyboard,Mechanical,99,${imageKeys("keyboard")}`);

    expect(result).toEqual({
      products: [{ name: "Keyboard", description: "Mechanical", price: 99, images: productImages("keyboard") }],
      errors: [{ row: 2, message: "description is required" }],
    });
  });

  it("throws on a non-numeric price", () => {
    expect(parseProductCsv(`${HEADER}\nMouse,A mouse,free,${imageKeys("mouse")}`).errors).toEqual([
      { row: 2, message: "price must be a valid non-negative number" },
    ]);
  });

  it("throws on a negative or out-of-range price", () => {
    expect(parseProductCsv(`${HEADER}\nMouse,A mouse,-1,${imageKeys("mouse")}`).errors).toHaveLength(1);
    expect(parseProductCsv(`${HEADER}\nMouse,A mouse,999999999,${imageKeys("mouse")}`).errors).toHaveLength(1);
  });

  it("rejects content larger than the configured byte limit", () => {
    const oversized = `${HEADER}\n${"x".repeat(MAX_CSV_BYTES + 1)},desc,1,${imageKeys("image")}`;

    expect(() => parseProductCsv(oversized)).toThrow("exceeds maximum allowed size");
  });

  it("rejects more rows than the configured limit", () => {
    const rows = Array.from({ length: MAX_PRODUCT_ROWS + 1 }, (_, i) => `Product ${i},desc,1,${imageKeys(String(i))}`).join("\n");

    expect(() => parseProductCsv(`${HEADER}\n${rows}`)).toThrow("exceeds maximum allowed rows");
  });

  it("rejects fields that look like spreadsheet formula injection", () => {
    expect(parseProductCsv(`${HEADER}\n=cmd|calc,desc,1,${imageKeys("image")}`).errors[0].message).toContain("disallowed character");
    expect(parseProductCsv(`${HEADER}\nMouse,@SUM(1+1),1,${imageKeys("image")}`).errors[0].message).toContain("disallowed character");
  });

  it("rejects fields containing control characters", () => {
    expect(parseProductCsv(`${HEADER}\nMou\x00se,desc,1,${imageKeys("image")}`).errors[0].message).toContain("control characters");
  });

  it("rejects fields longer than the configured max length", () => {
    const longName = "a".repeat(501);

    expect(parseProductCsv(`${HEADER}\n${longName},desc,1,${imageKeys("image")}`).errors[0].message).toContain("too long");
  });

  it("rejects absolute image URLs and accepts quoted commas", () => {
    expect(parseProductCsv(`${HEADER}\nMouse,A mouse,9.99,https://example.com/mouse.webp,products/mouse/medium.webp,products/mouse/large.webp`).errors).toEqual([
      { row: 2, message: "image keys must be relative R2 storage keys" },
    ]);
    expect(parseProductCsv(`${HEADER}\nMouse,"A mouse, wireless",9.99,${imageKeys("mouse")}`).products).toEqual([
      { name: "Mouse", description: "A mouse, wireless", price: 9.99, images: productImages("mouse") },
    ]);
  });
});
