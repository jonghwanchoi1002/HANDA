import { betterAuth, type BetterAuthOptions } from "better-auth";
import type { Pool } from "pg";

export type AuthMail = { to: string; subject: string; text: string };
export type AuthSettings = {
  database: Pool;
  baseURL: string;
  secret: string;
  sendMail?: (mail: AuthMail) => Promise<void>;
  google?: { clientId: string; clientSecret: string };
  backgroundTask?: (task: Promise<unknown>) => void;
};

export function authOptions(settings: AuthSettings) {
  return {
    appName: "HANDA", database: settings.database,
    baseURL: settings.baseURL, secret: settings.secret,
    trustedOrigins: [new URL(settings.baseURL).origin],
    user: {
      modelName: "handa_auth_user",
      additionalFields: {
        role: { type: "string", defaultValue: "member", input: false },
        approvalStatus: { type: "string", fieldName: "approval_status", defaultValue: "pending", input: false },
      },
    },
    session: { modelName: "handa_auth_session", expiresIn: 60 * 60 * 24 * 7, cookieCache: { enabled: false } },
    account: { modelName: "handa_auth_account", encryptOAuthTokens: true, accountLinking: { enabled: true, requireLocalEmailVerified: true } },
    verification: { modelName: "handa_auth_verification" },
    rateLimit: { enabled: true, storage: "database", modelName: "handa_auth_rate_limit", window: 60, max: 30,
      customRules: { "/sign-in/email": { window: 60, max: 5 }, "/sign-up/email": { window: 60, max: 3 }, "/request-password-reset": { window: 60, max: 3 }, "/send-verification-email": { window: 60, max: 3 } } },
    emailAndPassword: {
      enabled: Boolean(settings.sendMail), requireEmailVerification: true, minPasswordLength: 12, maxPasswordLength: 128, autoSignIn: false, revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        if (!settings.sendMail) throw new Error("Mail delivery is not configured.");
        await settings.sendMail({ to: user.email, subject: "HANDA 비밀번호 재설정", text: `비밀번호를 변경하려면 아래 링크를 여세요. 요청한 적이 없다면 무시하셔도 됩니다.\n\n${url}` });
      },
    },
    emailVerification: {
      sendOnSignUp: true, sendOnSignIn: true, autoSignInAfterVerification: false, expiresIn: 60 * 60,
      sendVerificationEmail: async ({ user, url }) => {
        if (!settings.sendMail) throw new Error("Mail delivery is not configured.");
        await settings.sendMail({ to: user.email, subject: "HANDA 이메일 주소 확인", text: `아래 링크를 열어 이메일 주소를 확인해 주세요. 이메일 확인 후에도 관리자 승인이 필요합니다.\n\n${url}` });
      },
    },
    socialProviders: settings.google ? { google: { ...settings.google, prompt: "select_account" } } : {},
    advanced: { ...(settings.backgroundTask ? { backgroundTasks: { handler: settings.backgroundTask } } : {}) },
    logger: { disabled: true },
  } satisfies BetterAuthOptions;
}
export function createHandaAuth(settings: AuthSettings) { return betterAuth(authOptions(settings)); }
