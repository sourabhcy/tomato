import { MAX_CSV_BYTES, MAX_PRODUCT_ROWS, parseProductCsv } from "./productCsv";

describe("parseProductCsv", () => {
  it("parses valid rows, skipping the header", () => {
    const result = parseProductCsv("name,description,price,image_url\nMouse,A mouse,9.99,products/mouse.webp\nKeyboard,A keyboard,19.99,products/keyboard.webp");

    expect(result).toEqual({
      products: [
        { name: "Mouse", description: "A mouse", price: 9.99, storageKey: "products/mouse.webp" },
        { name: "Keyboard", description: "A keyboard", price: 19.99, storageKey: "products/keyboard.webp" },
      ],
      errors: [],
    });
  });

  it("ignores blank lines", () => {
    const result = parseProductCsv("name,description,price,image_url\n\nMouse,A mouse,9.99,products/mouse.webp\n\n");

    expect(result).toEqual({
      products: [{ name: "Mouse", description: "A mouse", price: 9.99, storageKey: "products/mouse.webp" }],
      errors: [],
    });
  });

  it("reports row-level validation errors while retaining valid rows", () => {
    const result = parseProductCsv("name,description,price,image_url\nMouse,,9.99,products/mouse.webp\nKeyboard,Mechanical,99,products/keyboard.webp");

    expect(result).toEqual({
      products: [{ name: "Keyboard", description: "Mechanical", price: 99, storageKey: "products/keyboard.webp" }],
      errors: [{ row: 2, message: "description is required" }],
    });
  });

  it("throws on a non-numeric price", () => {
    expect(parseProductCsv("name,description,price,image_url\nMouse,A mouse,free,products/mouse.webp").errors).toEqual([
      { row: 2, message: "price must be a valid non-negative number" },
    ]);
  });

  it("throws on a negative or out-of-range price", () => {
    expect(parseProductCsv("name,description,price,image_url\nMouse,A mouse,-1,products/mouse.webp").errors).toHaveLength(1);
    expect(parseProductCsv("name,description,price,image_url\nMouse,A mouse,999999999,products/mouse.webp").errors).toHaveLength(1);
  });

  it("rejects content larger than the configured byte limit", () => {
    const oversized = `name,description,price,image_url\n${"x".repeat(MAX_CSV_BYTES + 1)},desc,1,products/image.webp`;

    expect(() => parseProductCsv(oversized)).toThrow("exceeds maximum allowed size");
  });

  it("rejects more rows than the configured limit", () => {
    const rows = Array.from({ length: MAX_PRODUCT_ROWS + 1 }, (_, i) => `Product ${i},desc,1,products/${i}.webp`).join("\n");

    expect(() => parseProductCsv(`name,description,price,image_url\n${rows}`)).toThrow("exceeds maximum allowed rows");
  });

  it("rejects fields that look like spreadsheet formula injection", () => {
    expect(parseProductCsv("name,description,price,image_url\n=cmd|calc,desc,1,products/image.webp").errors[0].message).toContain("disallowed character");
    expect(parseProductCsv("name,description,price,image_url\nMouse,@SUM(1+1),1,products/image.webp").errors[0].message).toContain("disallowed character");
  });

  it("rejects fields containing control characters", () => {
    expect(parseProductCsv("name,description,price,image_url\nMou\x00se,desc,1,products/image.webp").errors[0].message).toContain("control characters");
  });

  it("rejects fields longer than the configured max length", () => {
    const longName = "a".repeat(501);

    expect(parseProductCsv(`name,description,price,image_url\n${longName},desc,1,products/image.webp`).errors[0].message).toContain("too long");
  });

  it("rejects absolute URLs and accepts quoted commas", () => {
    expect(parseProductCsv("name,description,price,image_url\nMouse,A mouse,9.99,https://example.com/mouse.webp").errors).toEqual([
      { row: 2, message: "image_url must be a relative R2 storage key" },
    ]);
    expect(parseProductCsv('name,description,price,image_url\nMouse,"A mouse, wireless",9.99,products/mouse.webp').products).toEqual([
      { name: "Mouse", description: "A mouse, wireless", price: 9.99, storageKey: "products/mouse.webp" },
    ]);
  });
});
