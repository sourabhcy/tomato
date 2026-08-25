import pool from "@/db/pool";

export default async function getProducts(){
 const result = await pool.query(`
        SELECT id, name,description, price
        FROM products
        ORDER BY created_at DESC
        limit 10
    `);
    const products = result.rows;
    return products;
}