import bcrypt from "bcrypt";
import pool from "@/db/pool";

export type SubUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const USER_COLUMNS = "id, name, email, role";

export async function getAllUsers() {
  const result = await pool.query<SubUser>(
    `SELECT ${USER_COLUMNS} FROM users ORDER BY created_at ASC, id ASC`
  );

  return result.rows;
}

export async function createSubUser(name: string, email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query<SubUser>(
    `
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, $2, $3, 'user')
    RETURNING ${USER_COLUMNS}
    `,
    [name, email, passwordHash]
  );

  return result.rows[0];
}

export async function deleteUser(userId: number) {
  // Admin accounts must never be deletable, even if the caller bypasses UI checks.
  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 AND role <> 'admin'`,
    [userId]
  );

  if (result.rowCount === 0) {
    throw new Error("User not found or cannot be deleted");
  }
}
