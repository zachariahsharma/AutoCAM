"use client";
import Layout from "@/components/layout";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { FormEvent } from "react";

export default function Login() {
  const login = async (e: FormEvent) => {
    e.preventDefault();
    await authClient.signIn.username({
      username: e.target.username.value,
      password: e.target.password.value,
    }, {
      onSuccess: () => redirect("/"),
    })
  };
  return <Layout>
    <div className="container login-white" style={{ maxWidth: "460px" }}>
      <div className="card gh-box">
        <div className="card-body">
          <h3 className="mb-3">Login</h3>
          <form onSubmit={login}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input name="username" type="text" id="emailInput" className="form-control gh-input" placeholder="valor" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input name="password" type="password" id="passwordInput" className="form-control gh-input" placeholder="Your password" required />
            </div>
            <button className="btn btn-primary w-100">Login</button>
          </form>
        </div>
      </div>
    </div>
  </Layout>;
}
