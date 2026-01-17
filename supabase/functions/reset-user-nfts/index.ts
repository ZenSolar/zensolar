import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createWalletClient, createPublicClient, http, parseAbi, formatEther } from "npm:viem@2.43.5";
import { privateKeyToAccount } from "npm:viem@2.43.5/accounts";
import { baseSepolia } from "npm:viem@2.43.5/chains";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Contract addresses (Base Sepolia)
const ZSOLAR_NFT_ADDRESS = "0xD1d509a48CEbB8f9f9aAA462979D7977c30424E3";
const ZENSOLAR_CONTROLLER_ADDRESS = "0x54542Ad80FACbedA774465fE9724c281FBaf7437";

// ZenSolarNFT ABI - includes burn function
const NFT_ABI = parseAbi([
  "function burn(address from, uint256 tokenId) external",
  "function getOwnedTokens(address user) external view returns (uint256[])",
  "function hasToken(address user, uint256 tokenId) external view returns (bool)",
  "function owner() external view returns (address)",
]);

// Controller ABI - for resetting user stats
const CONTROLLER_ABI = parseAbi([
  "function owner() external view returns (address)",
]);

// NFT name mappings
const NFT_NAMES: Record<number, string> = {
  0: "Welcome",
  1: "Sunspark", 2: "Photonic", 3: "Rayforge", 4: "Solaris", 5: "Helios", 6: "Sunforge", 7: "Gigasun", 8: "Starforge",
  9: "Voltbank", 10: "Gridpulse", 11: "Megacell", 12: "Reservex", 13: "Dynamax", 14: "Ultracell", 15: "Gigavolt",
  16: "Ignite", 17: "Voltcharge", 18: "Kilovolt", 19: "Ampforge", 20: "Chargeon", 21: "Gigacharge", 22: "Megacharge", 23: "Teracharge",
  24: "Ignitor", 25: "Velocity", 26: "Autobahn", 27: "Hyperdrive", 28: "Electra", 29: "Velocity Pro", 30: "Mach One", 31: "Centaurion", 32: "Voyager", 33: "Odyssey",
  34: "Duality", 35: "Trifecta", 36: "Quadrant", 37: "Constellation", 38: "Cyber Echo", 39: "Zenith", 40: "ZenMaster", 41: "Total Eclipse",
};

// Helper to safely get owned NFTs
async function safeGetOwnedTokens(publicClient: any, walletAddress: string): Promise<bigint[]> {
  try {
    const ownedNFTs = await publicClient.readContract({
      address: ZSOLAR_NFT_ADDRESS as `0x${string}`,
      abi: NFT_ABI,
      functionName: "getOwnedTokens",
      args: [walletAddress as `0x${string}`],
    });
    return ownedNFTs as bigint[];
  } catch (error) {
    console.log("getOwnedTokens reverted (wallet may not have any NFTs):", walletAddress);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const minterPrivateKey = Deno.env.get("MINTER_PRIVATE_KEY");
    if (!minterPrivateKey) {
      console.error("MINTER_PRIVATE_KEY not configured");
      return new Response(JSON.stringify({ error: "Minter not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formattedPrivateKey = minterPrivateKey.startsWith("0x") 
      ? minterPrivateKey as `0x${string}`
      : `0x${minterPrivateKey}` as `0x${string}`;

    const account = privateKeyToAccount(formattedPrivateKey);
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    console.log("Reset NFTs - Minter wallet:", account.address);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if requesting user is admin
    const { data: isAdmin } = await supabaseClient.rpc('is_admin', { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, walletAddress, targetUserId } = body;

    console.log(`Admin ${user.id} performing ${action}`);

    // Helper to find user by wallet address
    async function findUserByWallet(wallet: string) {
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("user_id, wallet_address, display_name")
        .eq("wallet_address", wallet.toLowerCase())
        .maybeSingle();

      // Try case-insensitive match if exact match fails
      if (!profile) {
        const { data: profiles } = await supabaseClient
          .from("profiles")
          .select("user_id, wallet_address, display_name")
          .not("wallet_address", "is", null);

        if (profiles) {
          const match = profiles.find(p => 
            p.wallet_address?.toLowerCase() === wallet.toLowerCase()
          );
          if (match) return match;
        }
      }

      return profile;
    }

    if (action === "preview") {
      // Preview what would be reset for a user
      const lookupWallet = walletAddress || null;
      const lookupUserId = targetUserId || null;

      if (!lookupWallet && !lookupUserId) {
        return new Response(JSON.stringify({ error: "walletAddress or targetUserId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find user by wallet address or user ID
      let profile: { user_id: string; wallet_address: string | null; display_name: string | null } | null = null;
      
      if (lookupWallet) {
        profile = await findUserByWallet(lookupWallet);
      } else if (lookupUserId) {
        const { data } = await supabaseClient
          .from("profiles")
          .select("user_id, wallet_address, display_name")
          .eq("user_id", lookupUserId)
          .single();
        profile = data;
      }

      if (!profile) {
        return new Response(JSON.stringify({ error: "User not found with that wallet address" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = profile.user_id;

      // Get mint history from database
      const { data: mintTransactions } = await supabaseClient
        .from("mint_transactions")
        .select("id, nfts_minted, nft_names, tokens_minted, created_at, tx_hash")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Get on-chain NFTs if wallet connected
      let onChainNFTs: number[] = [];
      if (profile.wallet_address) {
        try {
          const ownedTokens = await safeGetOwnedTokens(publicClient, profile.wallet_address);
          onChainNFTs = ownedTokens.map(id => Number(id));
        } catch (e) {
          console.log("Could not fetch on-chain NFTs:", e);
        }
      }

      // Collect unique NFT IDs from database
      const dbNFTs = new Set<number>();
      if (mintTransactions) {
        for (const tx of mintTransactions) {
          if (tx.nfts_minted && Array.isArray(tx.nfts_minted)) {
            for (const id of tx.nfts_minted) {
              dbNFTs.add(id);
            }
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        preview: {
          userId,
          displayName: profile.display_name,
          walletAddress: profile.wallet_address,
          onChainNFTs: onChainNFTs.map(id => ({ id, name: NFT_NAMES[id] || `Token #${id}` })),
          databaseNFTs: [...dbNFTs].map(id => ({ id, name: NFT_NAMES[id] || `Token #${id}` })),
          mintTransactionCount: mintTransactions?.length || 0,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset") {
      // Full reset: burn on-chain NFTs + clear database records
      const lookupWallet = walletAddress || null;
      const lookupUserId = targetUserId || null;

      if (!lookupWallet && !lookupUserId) {
        return new Response(JSON.stringify({ error: "walletAddress or targetUserId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find user by wallet address or user ID
      let profile: { user_id: string; wallet_address: string | null; display_name: string | null } | null = null;
      
      if (lookupWallet) {
        profile = await findUserByWallet(lookupWallet);
      } else if (lookupUserId) {
        const { data } = await supabaseClient
          .from("profiles")
          .select("user_id, wallet_address, display_name")
          .eq("user_id", lookupUserId)
          .single();
        profile = data;
      }

      if (!profile) {
        return new Response(JSON.stringify({ error: "User not found with that wallet address" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = profile.user_id;

      const results = {
        onChainBurns: [] as { tokenId: number; name: string; txHash: string }[],
        onChainErrors: [] as { tokenId: number; name: string; error: string }[],
        dbTransactionsDeleted: 0,
        baselinesReset: 0,
      };

      // Step 1: Burn on-chain NFTs if wallet connected
      if (profile.wallet_address) {
        // Check NFT contract ownership
        const nftOwner = await publicClient.readContract({
          address: ZSOLAR_NFT_ADDRESS as `0x${string}`,
          abi: NFT_ABI,
          functionName: "owner",
        });

        console.log("NFT contract owner:", nftOwner);
        console.log("Controller address:", ZENSOLAR_CONTROLLER_ADDRESS);

        // The NFT contract is owned by the Controller, which is owned by the minter
        // But burn() requires onlyOwner which is the Controller, not us directly
        // We need to call through the controller OR the NFT contract must allow the minter
        
        // For now, get the owned tokens and try to burn them
        const ownedTokens = await safeGetOwnedTokens(publicClient, profile.wallet_address);
        console.log(`Found ${ownedTokens.length} on-chain NFTs for ${profile.wallet_address}`);

        for (const tokenId of ownedTokens) {
          const id = Number(tokenId);
          const name = NFT_NAMES[id] || `Token #${id}`;
          
          try {
            console.log(`Attempting to burn token ${id} (${name}) from ${profile.wallet_address}`);
            
            // Note: This will only work if the minter wallet is the NFT contract owner
            // or if the Controller has a burnUserNFT function we can call
            // Since the NFT is owned by the Controller and Controller is owned by minter,
            // we need the Controller to call burn on the NFT
            
            // For now, we'll record the attempt. In practice, you may need to:
            // 1. Add a burnUserNFT function to the Controller
            // 2. Or transfer NFT ownership to the minter wallet
            // 3. Or implement an admin burn pattern
            
            // Since the NFT contract's burn() is onlyOwner (Controller),
            // and we can't call Controller functions directly for burn,
            // we'll note this limitation
            
            results.onChainErrors.push({
              tokenId: id,
              name,
              error: "On-chain burn requires Controller modification (NFT owned by Controller, not minter directly)"
            });
            
          } catch (error: any) {
            console.error(`Failed to burn token ${id}:`, error);
            results.onChainErrors.push({
              tokenId: id,
              name,
              error: error.message || "Unknown error"
            });
          }
        }
      }

      // Step 2: Delete mint_transactions from database
      const { data: deletedTxs, error: deleteTxError } = await supabaseClient
        .from("mint_transactions")
        .delete()
        .eq("user_id", userId)
        .select("id");

      if (deleteTxError) {
        console.error("Failed to delete mint transactions:", deleteTxError);
      } else {
        results.dbTransactionsDeleted = deletedTxs?.length || 0;
        console.log(`Deleted ${results.dbTransactionsDeleted} mint transactions`);
      }

      // Step 3: Reset device baselines (optional, controlled by parameter)
      const { resetBaselines } = body;
      if (resetBaselines) {
        const { data: updatedDevices, error: baselineError } = await supabaseClient
          .from("connected_devices")
          .update({ 
            baseline_data: null,
            last_minted_at: null 
          })
          .eq("user_id", userId)
          .select("id");

        if (baselineError) {
          console.error("Failed to reset baselines:", baselineError);
        } else {
          results.baselinesReset = updatedDevices?.length || 0;
          console.log(`Reset baselines for ${results.baselinesReset} devices`);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: `NFT reset completed for ${profile.display_name || profile.wallet_address}`,
        results,
        note: results.onChainErrors.length > 0 
          ? "On-chain NFTs could not be burned automatically. The database has been cleared so the user can re-earn and re-mint NFTs. The old on-chain NFTs will remain but won't affect new minting."
          : undefined,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'preview' or 'reset'" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Reset NFTs error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Internal server error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
