// @ts-expect-error
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

// @ts-ignore
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, newPassword }: ResetPasswordRequest = await req.json();
    if (!email || !code || !newPassword) {
      throw new Error("Missing required fields: email, code, newPassword");
    }
    if (typeof email !== "string" || typeof code !== "string" || typeof newPassword !== "string") {
      throw new Error("Invalid field types");
    }

    // @ts-ignore
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // @ts-ignore
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase service credentials");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get latest unconsumed and not expired reset record for email
    const { data: resetRow, error: resetErr } = await supabase
      .from("password_resets")
      .select("id, email, user_id, code_hash, salt, expires_at, consumed_at, created_at")
      .eq("email", email)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resetErr) throw resetErr;
    if (!resetRow) throw new Error("No active reset request found for this email");

    // Check expiry
    const now = Date.now();
    const expiresAt = new Date(resetRow.expires_at).getTime();
    if (isFinite(expiresAt) && expiresAt < now) {
      throw new Error("Reset code has expired");
    }

    // Verify code
    const computed = await sha256Hex(`${resetRow.salt}|${code}`);
    if (computed !== resetRow.code_hash) {
      throw new Error("Invalid verification code");
    }

    // Resolve user id (if missing) using Auth Admin API by email
    let userId = resetRow.user_id as string | null;
    if (!userId) {
      const adminUrl = `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
      const resp = await fetch(adminUrl, {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey as string,
        },
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(`Failed to fetch user by email: ${txt}`);
      }
      const body = await resp.json().catch(() => ({} as any));
      // Body may be an array or an object with users[] depending on deployment
      const users = Array.isArray(body) ? body : (Array.isArray(body?.users) ? body.users : []);
      const found = users[0];
      if (!found?.id) throw new Error("User not found for email");
      userId = found.id as string;
    }

    // Update password via admin API
    const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (updErr) throw updErr;

    // Mark the reset row as consumed
    const { error: consumeErr } = await supabase
      .from("password_resets")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", resetRow.id);
    if (consumeErr) throw consumeErr;

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error in reset-password:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
