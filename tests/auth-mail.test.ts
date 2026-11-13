import assert from "node:assert/strict";
import { test } from "node:test";
import nodemailer from "nodemailer";
import { createAuthMailer, getMailConfig } from "../src/lib/auth/mail";

const gmail = { MAIL_PROVIDER: "gmail", GMAIL_USER: "handa.community@gmail.com", GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop" };
const mail = { to: "recipient@example.com", subject: "HANDA 이메일 주소 확인", text: "https://example.com/verify?token=private-token" };

test("Gmail is explicitly selected, normalizes app passwords and never falls back to Resend", () => {
  assert.deepEqual(getMailConfig(gmail), { provider: "gmail", user: gmail.GMAIL_USER, password: "abcdefghijklmnop" });
  for (const changes of [{ GMAIL_APP_PASSWORD: "" }, { GMAIL_APP_PASSWORD: "short" }, { GMAIL_USER: "" }, { GMAIL_USER: "HANDA <test@gmail.com>" }]) {
    assert.equal(getMailConfig({ ...gmail, ...changes, RESEND_API_KEY: "unused", MAIL_FROM: "unused" }), null);
  }
  assert.equal(getMailConfig({ ...gmail, MAIL_PROVIDER: "unknown" }), null);
  assert.deepEqual(getMailConfig({ RESEND_API_KEY: "key", MAIL_FROM: "HANDA <test@example.com>" }), { provider: "resend", apiKey: "key", from: "HANDA <test@example.com>" });
  assert.equal(getMailConfig({}), null);
});

test("Gmail uses authenticated STARTTLS and sends verification, reset and change messages from the Gmail account", async t => {
  let options: unknown;
  const sent: unknown[] = [];
  t.mock.method(nodemailer, "createTransport", (value: unknown) => {
    options = value;
    return { sendMail: async (message: unknown) => { sent.push(message); return { accepted: [mail.to], rejected: [] }; } } as unknown as ReturnType<typeof nodemailer.createTransport>;
  });
  const send = createAuthMailer(getMailConfig(gmail)!);
  for (const subject of [mail.subject, "HANDA 비밀번호 재설정", "HANDA 이메일 변경 요청 확인"]) await send({ ...mail, subject });
  assert.deepEqual(options, {
    host: "smtp.gmail.com", port: 587, secure: false, requireTLS: true,
    auth: { user: gmail.GMAIL_USER, pass: "abcdefghijklmnop" }, tls: { minVersion: "TLSv1.2" },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000, logger: false, debug: false,
  });
  assert.equal(sent.length, 3);
  assert.deepEqual(sent[0], { from: { name: "HANDA", address: gmail.GMAIL_USER }, ...mail });
});

test("SMTP errors and rejected recipients fail without exposing passwords, recipients or verification tokens", async t => {
  t.mock.method(nodemailer, "createTransport", () => ({ sendMail: async () => { throw Object.assign(new Error(JSON.stringify({ gmail, mail })), { code: "EAUTH" }); } }) as unknown as ReturnType<typeof nodemailer.createTransport>);
  await assert.rejects(createAuthMailer(getMailConfig(gmail)!)(mail), error => {
    assert.equal((error as Error).message, "Authentication email delivery failed (gmail: EAUTH).");
    assert.equal(JSON.stringify(error).includes(mail.to), false);
    return true;
  });
  t.mock.restoreAll();
  t.mock.method(nodemailer, "createTransport", () => ({ sendMail: async () => ({ accepted: [], rejected: [mail.to] }) }) as unknown as ReturnType<typeof nodemailer.createTransport>);
  await assert.rejects(createAuthMailer(getMailConfig(gmail)!)(mail), /RECIPIENT_REJECTED/);
});

test("Resend remains available and HTTP errors expose only the provider status code", async t => {
  let request: RequestInit | undefined;
  t.mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => {
    request = init;
    return new Response("{}", { status: 200 });
  });
  const send = createAuthMailer(getMailConfig({ RESEND_API_KEY: "key", MAIL_FROM: "HANDA <test@example.com>" })!);
  await send(mail);
  assert.deepEqual(JSON.parse(String(request?.body)), { from: "HANDA <test@example.com>", ...mail });
  t.mock.restoreAll();
  t.mock.method(globalThis, "fetch", async () => new Response("sensitive response", { status: 403 }));
  await assert.rejects(send(mail), /resend: HTTP_403/);
});
