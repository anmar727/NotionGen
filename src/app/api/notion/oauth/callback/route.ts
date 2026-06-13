import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { encryptSecret } from "@/lib/encryption";
import { exchangeNotionCode } from "@/lib/notion";
import { assertUser, getSupabaseAdminClient } from "@/lib/supabase";

type OAuthState = {
  userId: string;
  templateId: string;
  nonce: string;
};

export async function GET(request: Request) {
  const callbackUrl = new URL(request.url);
  const code = callbackUrl.searchParams.get("code");
  const state = callbackUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("notion_oauth_state")?.value;

  try {
    const user = await assertUser();
    if (!code || !state || state !== expectedState) {
      throw new Error("Invalid Notion OAuth callback state.");
    }

    const parsedState = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as OAuthState;
    if (parsedState.userId !== user.id) throw new Error("OAuth state user mismatch.");

    const token = await exchangeNotionCode(code);
    const supabase = getSupabaseAdminClient();

    await supabase.from("notion_connections").upsert(
      {
        user_id: user.id,
        workspace_id: token.workspace_id,
        workspace_name: token.workspace_name,
        bot_id: token.bot_id,
        owner: token.owner ?? {},
        access_token_encrypted: encryptSecret(token.access_token),
        status: "active",
      },
      { onConflict: "user_id,workspace_id" },
    );

    cookieStore.delete("notion_oauth_state");
    return NextResponse.redirect(
      new URL(`/connect-notion?template=${parsedState.templateId}`, request.url),
    );
  } catch (error) {
    const redirect = new URL("/connect-notion", request.url);
    redirect.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Notion OAuth failed.",
    );
    return NextResponse.redirect(redirect);
  }
}
