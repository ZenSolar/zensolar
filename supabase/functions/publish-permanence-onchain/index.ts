// Publishes the most recent Proof-of-Permanence™ Merkle root to Base Sepolia
// as a zero-value self-send carrying the root in calldata. This produces a
// public, immutable, timestamped anchor that any third party can verify by
// reading the transaction's input data on BaseScan.
//
// Auth: service-role only (caller must supply the service-role key). Designed
// to be invoked by pg_cron via pg_net every hour, or manually for testing.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { createWalletClient, createPublicClient, http } from "npm:viem@2.43.5";
import { privateKeyToAccount } from "npm:viem@2.43.5/accounts";
import { baseSepolia } from "npm:viem@2.43.5/chains";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Service-role gate
    const auth = req.headers.get("Authorization") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!auth.includes(serviceKey)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

    // Pick the oldest unpublished anchor (publish in order).
    const { data: anchor, error: pickErr } = await supabase
      .from("proof_of_permanence_anchors")
      .select("id, merkle_root, snapshot_at, onchain_tx_hash")
      .is("onchain_tx_hash", null)
      .order("snapshot_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (pickErr) throw pickErr;
    if (!anchor) {
      return new Response(JSON.stringify({ ok: true, skipped: "no-unpublished-anchor" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pk = Deno.env.get("MINTER_PRIVATE_KEY");
    if (!pk) {
      return new Response(JSON.stringify({ error: "MINTER_PRIVATE_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const formatted = (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`;
    const account = privateKeyToAccount(formatted);

    const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
    const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http() });

    // Calldata layout: 4-byte magic "ZSPP" (Zen Solar Proof of Permanence) + 32-byte root
    // Magic = 0x5a535050 — lets indexers filter to anchor txs cheaply.
    const root = anchor.merkle_root.startsWith("0x") ? anchor.merkle_root.slice(2) : anchor.merkle_root;
    if (root.length !== 64) {
      return new Response(JSON.stringify({ error: "Invalid merkle_root length", root }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = `0x5a535050${root}` as `0x${string}`;

    const txHash = await walletClient.sendTransaction({
      to: account.address,
      value: 0n,
      data,
    });

    // Wait for inclusion (Base Sepolia ~2s blocks; cap wait at 60s)
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });

    const { error: updErr } = await supabase
      .from("proof_of_permanence_anchors")
      .update({
        onchain_tx_hash: txHash,
        block_number: receipt.blockNumber.toString(),
      })
      .eq("id", anchor.id);
    if (updErr) throw updErr;

    return new Response(
      JSON.stringify({
        ok: true,
        anchor_id: anchor.id,
        merkle_root: anchor.merkle_root,
        tx_hash: txHash,
        block_number: receipt.blockNumber.toString(),
        explorer: `https://sepolia.basescan.org/tx/${txHash}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("publish-permanence-onchain error:", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
