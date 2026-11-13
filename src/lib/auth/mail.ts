import nodemailer from "nodemailer";
import type { AuthMail } from "./config";

type MailEnvironment = Record<string, string | undefined>;
export type MailConfig = { provider: "gmail"; user: string; password: string } | { provider: "resend"; apiKey: string; from: string };

export function getMailConfig(env: MailEnvironment = process.env): MailConfig | null {
  const provider = env.MAIL_PROVIDER?.trim() || "resend";
  if (provider === "gmail") {
    const user = env.GMAIL_USER?.trim();
    const password = env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
    return user && /^[^@\s<>]+@gmail\.com$/i.test(user) && password?.length === 16 ? { provider, user, password } : null;
  }
  if (provider === "resend" && env.RESEND_API_KEY?.trim() && env.MAIL_FROM?.trim()) {
    return { provider, apiKey: env.RESEND_API_KEY.trim(), from: env.MAIL_FROM.trim() };
  }
  return null;
}

/** Error details are deliberately limited to provider and safe diagnostic codes. */
export class AuthMailError extends Error {
  constructor(provider: MailConfig["provider"], code: string) {
    super(`Authentication email delivery failed (${provider}: ${code}).`);
    this.name = "AuthMailError";
  }
}

export function createAuthMailer(config: MailConfig) {
  const transport = config.provider === "gmail" ? nodemailer.createTransport({
    host: "smtp.gmail.com", port: 587, secure: false, requireTLS: true,
    auth: { user: config.user, pass: config.password },
    tls: { minVersion: "TLSv1.2" },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
    logger: false, debug: false,
  }) : null;

  return async (mail: AuthMail): Promise<void> => {
    if (config.provider === "gmail" && transport) {
      try {
        const result = await transport.sendMail({ from: { name: "HANDA", address: config.user }, ...mail });
        if (!result.accepted?.length || result.rejected?.length) throw new AuthMailError("gmail", "RECIPIENT_REJECTED");
      } catch (error) {
        if (error instanceof AuthMailError) throw error;
        const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
        const safeCode = typeof code === "string" && ["EAUTH", "ECONNECTION", "ETIMEDOUT", "ESOCKET", "ETLS", "EENVELOPE", "EMESSAGE"].includes(code) ? code : "SMTP_ERROR";
        throw new AuthMailError("gmail", safeCode);
      }
      return;
    }
    if (config.provider === "resend") {
      let response: Response;
      try {
        response = await fetch("https://api.resend.com/emails", {
          method: "POST", headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: config.from, ...mail }), signal: AbortSignal.timeout(10000),
        });
      } catch { throw new AuthMailError("resend", "NETWORK_ERROR"); }
      if (!response.ok) throw new AuthMailError("resend", `HTTP_${response.status}`);
    }
  };
}
