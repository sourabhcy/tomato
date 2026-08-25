"use client";

import { logout } from "@/app/actions/auth";

export default function LogoutButton() {
  async function handleLogout() {
    await logout();

    window.location.href = "/login";
  }

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}