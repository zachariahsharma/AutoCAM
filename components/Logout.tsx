"use client";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";

export default function Logout() {
  const logout = async () => await authClient.signOut({
    fetchOptions: {
      onSuccess: () => redirect("/login")
    }
  })

  return <button className="nav-link gh-link" onClick={logout}>Logout</button>
}