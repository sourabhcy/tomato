import pool from "@/db/pool";
import bcrypt from "bcrypt";
import { getAllUsers, createSubUser, deleteUser } from "./userService";

jest.mock("@/db/pool", () => ({ query: jest.fn() }));
jest.mock("bcrypt", () => ({ hash: jest.fn() }));

const mockQuery = jest.mocked(pool.query);
const mockHash = jest.mocked(bcrypt.hash);

describe("userService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns all users ordered by creation date", async () => {
    const rows = [{ id: 1, name: "Admin", email: "admin@example.com", role: "admin" }];
    mockQuery.mockResolvedValue({ rows } as never);

    const result = await getAllUsers();

    expect(result).toEqual(rows);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("FROM users"));
  });

  it("hashes the password and inserts a new sub user", async () => {
    mockHash.mockResolvedValue("hashed-password" as never);
    const row = { id: 2, name: "Sub", email: "sub@example.com", role: "user" };
    mockQuery.mockResolvedValue({ rows: [row] } as never);

    const result = await createSubUser("Sub", "sub@example.com", "plainpassword");

    expect(mockHash).toHaveBeenCalledWith("plainpassword", 10);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO users"),
      ["Sub", "sub@example.com", "hashed-password"]
    );
    expect(result).toEqual(row);
  });

  it("deletes a non-admin user", async () => {
    mockQuery.mockResolvedValue({ rowCount: 1 } as never);

    await expect(deleteUser(2)).resolves.toBeUndefined();
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("role <> 'admin'"), [2]);
  });

  it("throws when trying to delete an admin or missing user", async () => {
    mockQuery.mockResolvedValue({ rowCount: 0 } as never);

    await expect(deleteUser(1)).rejects.toThrow("cannot be deleted");
  });
});
