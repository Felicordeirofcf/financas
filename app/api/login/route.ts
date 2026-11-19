import { NextResponse } from "next/server";
import { AUTH_COOKIE, SESSION_MAX_AGE, checkCredentials, createSessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  let body: { user?: unknown; password?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    /* corpo inválido */
  }
  const user = typeof body.user === "string" ? body.user.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!checkCredentials(user, password)) {
    await new Promise((r) => setTimeout(r, 400)); // freio contra força bruta
    return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
