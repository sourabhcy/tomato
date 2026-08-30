import { uploadProductList } from "./products";
import { getSession } from "@/lib/session";
import { bulkInsertProducts } from "@/services/productService";

jest.mock("@/lib/session", () => ({ getSession: jest.fn() }));
jest.mock("@/services/productService", () => ({
  bulkInsertProducts: jest.fn(),
}));

const mockGetSession = jest.mocked(getSession);
const mockBulkInsertProducts = jest.mocked(bulkInsertProducts);

function csvFile(content: string) {
  const formData = new FormData();
  formData.set("file", new File([content], "products.csv", { type: "text/csv" }));
  return formData;
}

describe("uploadProductList action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects the upload when the caller is not an admin", async () => {
    mockGetSession.mockResolvedValue({ userId: 1, role: "user" });

    await expect(uploadProductList(csvFile("name,description,price\nMouse,A mouse,9.99"))).rejects.toThrow(
      "not authorized"
    );
    expect(mockBulkInsertProducts).not.toHaveBeenCalled();
  });

  it("parses the CSV and inserts the parsed products", async () => {
    mockGetSession.mockResolvedValue({ userId: 1, role: "admin" });
    mockBulkInsertProducts.mockResolvedValue(2);

    const result = await uploadProductList(
      csvFile("name,description,price\nMouse,A mouse,9.99\nKeyboard,A keyboard,19.99")
    );

    expect(mockBulkInsertProducts).toHaveBeenCalledWith([
      { name: "Mouse", description: "A mouse", price: 9.99 },
      { name: "Keyboard", description: "A keyboard", price: 19.99 },
    ]);
    expect(result).toEqual({ inserted: 2 });
  });

  it("rejects a malformed row", async () => {
    mockGetSession.mockResolvedValue({ userId: 1, role: "admin" });

    await expect(uploadProductList(csvFile("name,description,price\nMouse,A mouse,not-a-number"))).rejects.toThrow(
      "Invalid product row"
    );
  });

  it("rejects an oversized file without reading its content", async () => {
    mockGetSession.mockResolvedValue({ userId: 1, role: "admin" });

    const formData = new FormData();
    const oversizedFile = new File(["x"], "products.csv", { type: "text/csv" });
    Object.defineProperty(oversizedFile, "size", { value: 3 * 1024 * 1024 });
    formData.set("file", oversizedFile);

    await expect(uploadProductList(formData)).rejects.toThrow("exceeds maximum allowed size");
    expect(mockBulkInsertProducts).not.toHaveBeenCalled();
  });
});
