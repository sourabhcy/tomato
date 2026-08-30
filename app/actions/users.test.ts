import { listUsers, addSubUser, removeUser } from "./users";
import { getSession } from "@/lib/session";
import { getAllUsers, createSubUser, deleteUser } from "@/services/userService";

jest.mock("@/lib/session", () => ({ getSession: jest.fn() }));
jest.mock("@/services/userService", () => ({
  getAllUsers: jest.fn(),
  createSubUser: jest.fn(),
  deleteUser: jest.fn(),
}));

const mockGetSession = jest.mocked(getSession);
const mockGetAllUsers = jest.mocked(getAllUsers);
const mockCreateSubUser = jest.mocked(createSubUser);
const mockDeleteUser = jest.mocked(deleteUser);

describe("user actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects listing users when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(listUsers()).rejects.toThrow("not authorized");
    expect(mockGetAllUsers).not.toHaveBeenCalled();
  });

  it("rejects listing users when the caller is not an admin", async () => {
    mockGetSession.mockResolvedValue({ userId: 1, role: "user" });

    await expect(listUsers()).rejects.toThrow("not authorized");
    expect(mockGetAllUsers).not.toHaveBeenCalled();
  });

  it("lists users for an admin caller", async () => {
    mockGetSession.mockResolvedValue({ userId: 1, role: "admin" });
    mockGetAllUsers.mockResolvedValue([]);

    await listUsers();

    expect(mockGetAllUsers).toHaveBeenCalled();
  });

  it("rejects creating a sub user when the caller is not an admin", async () => {
    mockGetSession.mockResolvedValue({ userId: 2, role: "user" });

    await expect(addSubUser("Sub", "sub@example.com", "pass1234")).rejects.toThrow("not authorized");
    expect(mockCreateSubUser).not.toHaveBeenCalled();
  });

  it("creates a sub user for an admin caller", async () => {
    mockGetSession.mockResolvedValue({ userId: 1, role: "admin" });

    await addSubUser("Sub", "sub@example.com", "pass1234");

    expect(mockCreateSubUser).toHaveBeenCalledWith("Sub", "sub@example.com", "pass1234");
  });

  it("rejects deleting a user when the caller is not an admin", async () => {
    mockGetSession.mockResolvedValue({ userId: 2, role: "user" });

    await expect(removeUser(5)).rejects.toThrow("not authorized");
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("deletes a user for an admin caller", async () => {
    mockGetSession.mockResolvedValue({ userId: 1, role: "admin" });

    await removeUser(5);

    expect(mockDeleteUser).toHaveBeenCalledWith(5);
  });
});
