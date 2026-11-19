/**
 * Autenticação simples por usuário/senha com cookie de sessão assinado (HMAC-SHA256).
 * Credenciais via variáveis de ambiente; os valores padrão são admin / admin123.
 */
export const AUTH_COOKIE = "financas_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

export const authUser = () => process.env.AUTH_USER || "admin";
export const authPassword = () => process.env.AUTH_PASSWORD || "admin123";
const authSecret = () => process.env.AUTH_SECRET || `financas:${authUser()}:${authPassword()}`;

const enc = new TextEncoder();

async function hmac(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(authSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Comparação em tempo constante. */
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Token = expiração.assinatura */
export async function createSessionToken() {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  return `${exp}.${await hmac(`${authUser()}:${exp}`)}`;
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!sig || !Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  return safeEqual(sig, await hmac(`${authUser()}:${exp}`));
}

export function checkCredentials(user: string, password: string) {
  // Avalia as duas comparações sempre (sem curto-circuito)
  const u = safeEqual(user, authUser());
  const p = safeEqual(password, authPassword());
  return u && p;
}
