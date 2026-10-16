import "server-only";
import { after } from "next/server";
import { getDatabase } from "@/lib/content/database";
import { createHandaAuth, type AuthMail } from "./config";

let auth: ReturnType<typeof createHandaAuth> | undefined;
export function authAvailability() {
  const baseURL = process.env.BETTER_AUTH_URL;
  let validURL = false;
  try {
    const url = new URL(baseURL ?? "");
    validURL = url.pathname === "/" && !url.search && !url.hash && !url.username && !url.password && (url.protocol === "https:" || url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
  } catch { /* Missing configuration leaves sign-in disabled. */ }
  const configured = Boolean(process.env.DATABASE_URL && validURL && (process.env.BETTER_AUTH_SECRET?.length ?? 0) >= 32);
  return { configured, email: configured && Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM), google: configured && Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) };
}
async function sendMail(mail: AuthMail) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM, ...mail }), signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Email delivery failed.");
}
export function getAuth() {
  if (!authAvailability().configured) return null;
  if (!auth) {
    const availability = authAvailability();
    auth = createHandaAuth({
      database: getDatabase(), baseURL: new URL(process.env.BETTER_AUTH_URL!).origin, secret: process.env.BETTER_AUTH_SECRET!,
      sendMail: availability.email ? sendMail : undefined,
      google: availability.google ? { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! } : undefined,
      backgroundTask: (task) => after(async () => { try { await task; } catch { console.error("HANDA authentication email could not be delivered. Check the email provider."); } }),
    });
  }
  return auth;
}
