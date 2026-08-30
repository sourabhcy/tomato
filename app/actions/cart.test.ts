import { addToCart, removeFromCart } from "./cart";
import { getSession } from "@/lib/session";
import { addItemToCart, removeItemFromCart } from "@/services/cartService";

jest.mock("@/lib/session", () => ({ getSession: jest.fn() }));
jest.mock("@/services/cartService", () => ({
  addItemToCart: jest.fn(),
  removeItemFromCart: jest.fn(),
}));

const mockGetSession = jest.mocked(getSession);
const mockAddItemToCart = jest.mocked(addItemToCart);
const mockRemoveItemFromCart = jest.mocked(removeItemFromCart);

describe("cart actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects adding an item when the user is not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(addToCart(42)).rejects.toThrow("Not authenticated");
    expect(mockAddItemToCart).not.toHaveBeenCalled();
  });

  it("adds an item to the authenticated user's cart", async () => {
    mockGetSession.mockResolvedValue({ userId: 7, role: "user" });

    await addToCart(42);

    expect(mockAddItemToCart).toHaveBeenCalledWith(7, 42);
  });

  it("removes an item from the authenticated user's cart", async () => {
    mockGetSession.mockResolvedValue({ userId: 7, role: "user" });

    await removeFromCart(42);

    expect(mockRemoveItemFromCart).toHaveBeenCalledWith(7, 42);
  });
});
