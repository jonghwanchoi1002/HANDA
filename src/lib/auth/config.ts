import { z } from "zod";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { getAccountProfile } from "./account-profile";
import { canReadWiki } from "./permissions";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import type { Pool } from "pg";
import { findEmailAccount, normalizeEmailAddress, resolveGoogleEmail } from "./email-address";

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
      changeEmail: {
        enabled:Boolean(settings.sendMail),updateEmailWithoutVerification:false,
        sendChangeEmailConfirmation:async({user,newEmail,url})=>{
          if(!settings.sendMail)throw new Error("Mail delivery is not configured.");
          await settings.sendMail({to:user.email,subject:"HANDA 이메일 변경 요청 확인",text:`HANDA 로그인 이메일을 ${newEmail}로 변경하는 요청입니다. 본인이 요청했다면 아래 링크로 확인해 주세요. 이어서 새 이메일 주소도 확인해야 변경됩니다.

${url}`});
        },
      },
      additionalFields: {
        role: { type: "string", defaultValue: "member", input: false },
        approvalStatus: { type: "string", fieldName: "approval_status", defaultValue: "pending", input: false },
      },
    },
    hooks:{before:createAuthMiddleware(async(ctx)=>{
      if(ctx.path==="/sign-up/email"&&settings.sendMail&&typeof ctx.body?.email==="string"){
        const existing=await findEmailAccount(settings.database,ctx.body.email);
        if(existing)throw new APIError("CONFLICT",{code:"USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",message:"이미 가입된 이메일 주소입니다."});
        ctx.body.email=normalizeEmailAddress(ctx.body.email);
      }
      if(["/sign-in/email","/request-password-reset","/send-verification-email"].includes(ctx.path)&&typeof ctx.body?.email==="string"){
        ctx.body.email=(await findEmailAccount(settings.database,ctx.body.email))?.email??normalizeEmailAddress(ctx.body.email);
      }
      if(ctx.path==="/change-email"&&typeof ctx.body?.newEmail==="string"){
        if(await findEmailAccount(settings.database,ctx.body.newEmail))throw new APIError("CONFLICT",{code:"USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",message:"이미 가입된 이메일 주소입니다."});
        ctx.body.newEmail=normalizeEmailAddress(ctx.body.newEmail);
      }
      if(!["/update-user","/change-email","/change-password","/set-password"].includes(ctx.path))return;
      const session=await getSessionFromCtx(ctx);if(!session)throw new APIError("UNAUTHORIZED",{message:"로그인이 필요합니다."});
      const profile=await getAccountProfile(settings.database,session.user.id);
      if(!profile||!canReadWiki(profile))throw new APIError("FORBIDDEN",{message:"이용 승인 후 개인정보를 변경할 수 있습니다."});
      if(ctx.path!=="/update-user"&&profile.googleLinked)throw new APIError("FORBIDDEN",{message:"Google 연결 계정은 이 화면에서 이메일과 비밀번호를 변경할 수 없습니다."});
      if(ctx.path==="/update-user"&&ctx.body?.name!==undefined){
        const name=z.string().trim().min(1).max(100).safeParse(ctx.body.name);
        if(!name.success)throw new APIError("BAD_REQUEST",{message:"이름은 1~100자로 입력해 주세요."});
        ctx.body.name=name.data;
      }
    })},
    session: { modelName: "handa_auth_session", expiresIn: 60 * 60 * 24 * 7, cookieCache: { enabled: false } },
    account: { modelName: "handa_auth_account", encryptOAuthTokens: true, accountLinking: { enabled: true, requireLocalEmailVerified: true } },
    verification: { modelName: "handa_auth_verification" },
    rateLimit: { enabled: true, storage: "database", modelName: "handa_auth_rate_limit", window: 60, max: 30,
      customRules: { "/sign-in/email": { window: 60, max: 5 }, "/sign-up/email": { window: 60, max: 3 }, "/request-password-reset": { window: 60, max: 3 }, "/send-verification-email": { window: 60, max: 3 }, "/change-email": { window:60,max:3 }, "/change-password": { window:60,max:5 } } },
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
        await settings.sendMail({ to: user.email, subject: "HANDA 이메일 주소 확인", text: `아래 링크를 열어 이메일 주소를 확인해 주세요. 비즈니스 위키는 관리자 승인을 마친 회원만 이용할 수 있습니다.\n\n${url}` });
      },
    },
    databaseHooks: { user: { create: { before: async user => {
      return { data: { ...user, email: normalizeEmailAddress(user.email) } };
    } } } },
    socialProviders: settings.google ? { google: { ...settings.google, prompt: "select_account", mapProfileToUser: async profile => ({ email: await resolveGoogleEmail(settings.database,profile) }) } } : {},
    advanced: { ...(settings.backgroundTask ? { backgroundTasks: { handler: settings.backgroundTask } } : {}) },
    logger: { disabled: true },
  } satisfies BetterAuthOptions;
}
export function createHandaAuth(settings: AuthSettings) { return betterAuth(authOptions(settings)); }
