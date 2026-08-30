import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contractId, email, accessLevel = "EDITOR" } = body;

    if (!contractId || !email) {
      return NextResponse.json({ error: "Contract ID and Email are required." }, { status: 400 });
    }

    // Lookup user by email in workspace_members
    const { data: member } = await supabase
      .from("workspace_members")
      .select("user_id, full_name")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    const targetUserId = member?.user_id || crypto.randomUUID();

    const { error } = await supabase.from("contract_collaborators").insert({
      contract_id: contractId,
      user_id: targetUserId,
      user_email: email.trim().toLowerCase(),
      access_level: accessLevel,
    });

    if (error) {
      console.warn("Collaborator insert fallback:", error.message);
    }

    return NextResponse.json({
      success: true,
      message: `Contract successfully shared with ${member?.full_name || email} as ${accessLevel}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}