"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sha256, ADMIN_COOKIE } from "@/lib/auth";

export async function login(formData: FormData) {
  const pw = process.env.ADMIN_PASSWORD || "";
  const given = String(formData.get("password") || "");
  if (pw && given === pw) {
    cookies().set(ADMIN_COOKIE, await sha256(pw), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect("/admin");
  }
  redirect("/login?erro=1");
}

export async function logout() {
  cookies().set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  redirect("/login");
}
