import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createWalletClient, createPublicClient, http, parseAbi, formatEther } from "npm:viem@2.43.5";
import { privateKeyToAccount } from "npm:viem@2.43.5/accounts";
import { baseSepolia } from "npm:viem@2.43.5/chains";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Contract addresses (Base Sepolia - deployed 2026-01-15)
const ZSOLAR_TOKEN_ADDRESS = "0x4e704f5223FbfB588E9171981F40DB480B61106D";
const ZSOLAR_NFT_ADDRESS = "0x0D2E9f87c95cB95f37854DBe692e5BC1920e4B79";
const ZENSOLAR_CONTROLLER_ADDRESS = "0xADd3a1E135356806A382dd5008611b5E52AA867F";

// ZenSolar Controller ABI (only the functions we need)
const CONTROLLER_ABI = parseAbi([
  "function registerUser(address user) external",
  "function mintRewards(address user, uint256 solarDeltaKwh, uint256 evMilesDelta, uint256 batteryDeltaKwh, uint256 chargingDeltaKwh) external",
  "function mintComboNFT(address user, uint256 comboTokenId, string memory comboType) external",
  "function mintComboNFTBatch(address user, uint256[] calldata comboTokenIds, string[] calldata comboTypes) external",
  "function hasWelcomeNFT(address user) external view returns (bool)",
  "function getUserStats(address user) external view returns (uint256 solar, uint256 evMiles, uint256 battery, uint256 charging, bool hasWelcome)",
]);

// ZSOLAR Token ABI
const TOKEN_ABI = parseAbi([
  "function balanceOf(address account) external view returns (uint256)",
]);

// ZenSolarNFT ABI
const NFT_ABI = parseAbi([
  "function hasToken(address user, uint256 tokenId) external view returns (bool)",
  "function getOwnedTokens(address user) external view returns (uint256[])",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get minter private key from secrets
    const minterPrivateKey = Deno.env.get("MINTER_PRIVATE_KEY");
    if (!minterPrivateKey) {
      console.error("MINTER_PRIVATE_KEY not configured");
      return new Response(JSON.stringify({ error: "Minter not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure private key has 0x prefix
    const formattedPrivateKey = minterPrivateKey.startsWith("0x") 
      ? minterPrivateKey as `0x${string}`
      : `0x${minterPrivateKey}` as `0x${string}`;

    // Create viem clients
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

    console.log("Minter wallet address:", account.address);

    // Auth check
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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

    // Get request body
    const body = await req.json();
    const { action, walletAddress, tokenIds, comboTypes, solarDelta, evMilesDelta, batteryDelta, chargingDelta } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({ error: "Wallet address required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return new Response(JSON.stringify({ error: "Invalid wallet address format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${action} for user ${user.id}, wallet ${walletAddress}`);

    // Check minter has enough ETH for gas
    const minterBalance = await publicClient.getBalance({ address: account.address });
    console.log("Minter ETH balance:", formatEther(minterBalance));
    
    if (minterBalance < BigInt(1e15)) { // Less than 0.001 ETH
      return new Response(JSON.stringify({ 
        error: "Minter wallet needs more ETH for gas fees",
        minterBalance: formatEther(minterBalance)
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: Register user (mint Welcome NFT)
    if (action === "register") {
      // Check if user already has Welcome NFT
      const hasWelcome = await publicClient.readContract({
        address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
        abi: CONTROLLER_ABI,
        functionName: "hasWelcomeNFT",
        args: [walletAddress as `0x${string}`],
      });

      if (hasWelcome) {
        return new Response(JSON.stringify({ 
          success: true, 
          message: "User already registered with Welcome NFT",
          alreadyRegistered: true
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Register user (mints Welcome NFT)
      console.log("Registering user and minting Welcome NFT...");
      const hash = await walletClient.writeContract({
        address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
        abi: CONTROLLER_ABI,
        functionName: "registerUser",
        args: [walletAddress as `0x${string}`],
      });

      console.log("Register tx hash:", hash);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Register tx confirmed, status:", receipt.status);

      return new Response(JSON.stringify({
        success: receipt.status === "success",
        txHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        message: receipt.status === "success" 
          ? "Welcome NFT minted successfully!" 
          : "Transaction failed",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: Mint rewards (tokens + milestone NFTs)
    if (action === "mint-rewards") {
      const solar = BigInt(solarDelta || 0);
      const evMiles = BigInt(evMilesDelta || 0);
      const battery = BigInt(batteryDelta || 0);
      const charging = BigInt(chargingDelta || 0);

      const totalUnits = solar + evMiles + battery + charging;
      
      if (totalUnits === BigInt(0)) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "No rewards to mint - no activity delta" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Minting rewards: solar=${solar}, evMiles=${evMiles}, battery=${battery}, charging=${charging}`);

      const hash = await walletClient.writeContract({
        address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
        abi: CONTROLLER_ABI,
        functionName: "mintRewards",
        args: [
          walletAddress as `0x${string}`,
          solar,
          evMiles,
          battery,
          charging,
        ],
      });

      console.log("Mint rewards tx hash:", hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Mint rewards tx confirmed, status:", receipt.status);

      // Calculate expected tokens (93% of total goes to user)
      const expectedTokens = Number(totalUnits) * 0.93;

      return new Response(JSON.stringify({
        success: receipt.status === "success",
        txHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        tokensEstimate: expectedTokens,
        message: receipt.status === "success" 
          ? `Minted ~${expectedTokens.toFixed(0)} $ZSOLAR tokens!` 
          : "Transaction failed",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: Mint combo NFTs
    if (action === "mint-combos") {
      if (!tokenIds || !Array.isArray(tokenIds) || tokenIds.length === 0) {
        return new Response(JSON.stringify({ error: "tokenIds array required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!comboTypes || !Array.isArray(comboTypes) || comboTypes.length !== tokenIds.length) {
        return new Response(JSON.stringify({ error: "comboTypes array required (same length as tokenIds)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate token IDs are in combo range (34-41)
      const invalidIds = tokenIds.filter(id => id < 34 || id > 41);
      if (invalidIds.length > 0) {
        return new Response(JSON.stringify({ 
          error: `Invalid combo token IDs: ${invalidIds.join(", ")}. Must be 34-41.` 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Minting combo NFTs: ${tokenIds.join(", ")}`);

      const hash = await walletClient.writeContract({
        address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
        abi: CONTROLLER_ABI,
        functionName: "mintComboNFTBatch",
        args: [
          walletAddress as `0x${string}`,
          tokenIds.map(id => BigInt(id)),
          comboTypes,
        ],
      });

      console.log("Mint combos tx hash:", hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Mint combos tx confirmed, status:", receipt.status);

      return new Response(JSON.stringify({
        success: receipt.status === "success",
        txHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        mintedCount: tokenIds.length,
        message: receipt.status === "success" 
          ? `Minted ${tokenIds.length} combo NFT(s)!` 
          : "Transaction failed",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: Get user's on-chain status
    if (action === "status") {
      const [hasWelcome, tokenBalance, ownedNFTs] = await Promise.all([
        publicClient.readContract({
          address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
          abi: CONTROLLER_ABI,
          functionName: "hasWelcomeNFT",
          args: [walletAddress as `0x${string}`],
        }),
        publicClient.readContract({
          address: ZSOLAR_TOKEN_ADDRESS as `0x${string}`,
          abi: TOKEN_ABI,
          functionName: "balanceOf",
          args: [walletAddress as `0x${string}`],
        }),
        publicClient.readContract({
          address: ZSOLAR_NFT_ADDRESS as `0x${string}`,
          abi: NFT_ABI,
          functionName: "getOwnedTokens",
          args: [walletAddress as `0x${string}`],
        }),
      ]);

      return new Response(JSON.stringify({
        walletAddress,
        hasWelcomeNFT: hasWelcome,
        zsolarBalance: formatEther(tokenBalance as bigint),
        ownedNFTTokenIds: (ownedNFTs as bigint[]).map(id => Number(id)),
        nftCount: (ownedNFTs as bigint[]).length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use: register, mint-rewards, mint-combos, status" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Mint on-chain error:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for common errors
    if (errorMessage.includes("insufficient funds")) {
      return new Response(JSON.stringify({ 
        error: "Minter wallet needs more ETH for gas fees" 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (errorMessage.includes("User already registered") || errorMessage.includes("cannot mint Welcome")) {
      return new Response(JSON.stringify({ 
        success: true,
        alreadyRegistered: true,
        message: "User already has Welcome NFT" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      error: "Minting failed. Please try again.",
      details: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
