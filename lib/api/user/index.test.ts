import { NextRequest } from 'next/server';
import { describe, test } from "vitest";
import { POST } from "@/app/api/auth/[...all]/route";

describe("Create User", () => {
  test("Insecure password fails", async () => {
    const request = new NextRequest(`${process.env.BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "test@test.test",
        password: "password",
        name: "Test User",
      })
    })
    console.log(await (await POST(request)).json());
  });
});