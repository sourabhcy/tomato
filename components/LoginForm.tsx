"use client";

import { useState } from "react";
import { login } from "@/app/actions/auth";
import styles from "./LoginForm.module.css";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = await login(email, password);

    if (result.success) {
      window.location.href = "/products";
    } else {
      setMessage(result.message ?? "Login failed");
    }
  }

  return (
  <div className={styles.container}>
    <h1 className={styles.title}>Login</h1>

    <form onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className={styles.field}>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button className={styles.button} type="submit">
        Login
      </button>

      {message && (
        <p className={styles.error}>{message}</p>
      )}
    </form>
  </div>
);
}