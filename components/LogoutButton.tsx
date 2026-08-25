"use client";
import styles from "./LogoutButton.module.css";
import { logout } from "@/app/actions/auth";

export default function LogoutButton() {
  async function handleLogout() {
    await logout();

    window.location.href = "/login";
  }

  return (
    <button onClick={handleLogout} className={styles.button}>
      Logout
    </button>
  );
}