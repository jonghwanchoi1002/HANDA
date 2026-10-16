import { getAuth } from "@/lib/auth/server";

async function handler(request: Request) {
  const auth = getAuth();
  if (!auth) return Response.json({ message: "현재 로그인을 준비하고 있습니다." }, { status: 503 });
  return auth.handler(request);
}
export { handler as GET, handler as POST };
