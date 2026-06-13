import { NextResponse } from "next/server";
import { decryptSecret } from "@/lib/encryption";
import { searchAccessiblePages } from "@/lib/notion";
import { assertUser, getSupabaseAdminClient } from "@/lib/supabase";

export async function GET() {
  try {
    const user = await assertUser();
    const supabase = getSupabaseAdminClient();
    const { data: connection, error } = await supabase
      .from("notion_connections")
      .select("access_token_encrypted")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!connection) throw new Error("Connect Notion before searching pages.");

    const pages = await searchAccessiblePages(decryptSecret(connection.access_token_encrypted));
    return NextResponse.json({ pages });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search Notion pages." },
      { status: 400 },
    );
  }
}
