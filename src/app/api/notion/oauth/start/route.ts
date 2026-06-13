import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildNotionOAuthUrl } from "@/lib/notion";
import { assertUser } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const user = await assertUser();
    const url = new URL(request.url);
    const templateId = url.searchParams.get("template");
    if (!templateId) throw new Error("Missing template id.");

    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        templateId,
        nonce: randomBytes(16).toString("hex"),
      }),
    ).toString("base64url");

    const cookieStore = await cookies();
    cookieStore.set("notion_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
      path: "/",
    });

    return NextResponse.redirect(buildNotionOAuthUrl(state));
  } catch (error) {
    const redirect = new URL("/connect-notion", request.url);
    redirect.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Could not start Notion OAuth.",
    );
    return NextResponse.redirect(redirect);
  }
}
