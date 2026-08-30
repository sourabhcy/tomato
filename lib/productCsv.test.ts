import { MAX_CSV_BYTES, MAX_PRODUCT_ROWS, parseProductCsv } from "./productCsv";

describe("parseProductCsv", () => {
  it("parses valid rows, skipping the header", () => {
    const result = parseProductCsv("name,description,price\nMouse,A mouse,9.99\nKeyboard,A keyboard,19.99");

    expect(result).toEqual([
      { name: "Mouse", description: "A mouse", price: 9.99 },
      { name: "Keyboard", description: "A keyboard", price: 19.99 },
    ]);
  });

  it("ignores blank lines", () => {
    const result = parseProductCsv("name,description,price\n\nMouse,A mouse,9.99\n\n");

    expect(result).toEqual([{ name: "Mouse", description: "A mouse", price: 9.99 }]);
  });

  it("throws on a row missing a field", () => {
    expect(() => parseProductCsv("name,description,price\nMouse,,9.99")).toThrow("Invalid product row");
  });

  it("throws on a non-numeric price", () => {
    expect(() => parseProductCsv("name,description,price\nMouse,A mouse,free")).toThrow("Invalid product row");
  });

  it("throws on a negative or out-of-range price", () => {
    expect(() => parseProductCsv("name,description,price\nMouse,A mouse,-1")).toThrow("Invalid product row");
    expect(() => parseProductCsv("name,description,price\nMouse,A mouse,999999999")).toThrow("Invalid product row");
  });

  it("rejects content larger than the configured byte limit", () => {
    const oversized = `name,description,price\n${"x".repeat(MAX_CSV_BYTES + 1)},desc,1`;

    expect(() => parseProductCsv(oversized)).toThrow("exceeds maximum allowed size");
  });

  it("rejects more rows than the configured limit", () => {
    const rows = Array.from({ length: MAX_PRODUCT_ROWS + 1 }, (_, i) => `Product ${i},desc,1`).join("\n");

    expect(() => parseProductCsv(`name,description,price\n${rows}`)).toThrow("exceeds maximum allowed rows");
  });

  it("rejects fields that look like spreadsheet formula injection", () => {
    expect(() => parseProductCsv("name,description,price\n=cmd|calc,desc,1")).toThrow("disallowed character");
    expect(() => parseProductCsv("name,description,price\nMouse,@SUM(1+1),1")).toThrow("disallowed character");
  });

  it("rejects fields containing control characters", () => {
    expect(() => parseProductCsv("name,description,price\nMou\x00se,desc,1")).toThrow("control characters");
  });

  it("rejects fields longer than the configured max length", () => {
    const longName = "a".repeat(501);

    expect(() => parseProductCsv(`name,description,price\n${longName},desc,1`)).toThrow("too long");
  });
});
