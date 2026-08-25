import bcrypt from "bcrypt";
import pool from "@/db/pool";

export default async function authenticateUser(
  email: string,
  password: string
) {
  const result = await pool.query(
    `
    SELECT id, name, email, password_hash, role
    FROM users
    WHERE email = $1
    `,
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    return null;
  }

  const passwordMatch = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatch) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}