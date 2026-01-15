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

// NFT name mappings
const NFT_NAMES: Record<number, string> = {
  0: "Welcome",
  1: "Sunspark", 2: "Photonic", 3: "Rayforge", 4: "Solaris", 5: "Helios", 6: "Sunforge", 7: "Gigasun", 8: "Starforge",
  9: "Voltbank", 10: "Gridpulse", 11: "Megacell", 12: "Reservex", 13: "Dynamax", 14: "Ultracell", 15: "Gigavolt",
  16: "Ignite", 17: "Voltcharge", 18: "Kilovolt", 19: "Ampforge", 20: "Chargeon", 21: "Gigacharge", 22: "Megacharge", 23: "Teracharge",
  24: "Ignitor", 25: "Velocity", 26: "Autobahn", 27: "Hyperdrive", 28: "Electra", 29: "Velocity Pro", 30: "Mach One", 31: "Centaurion", 32: "Voyager", 33: "Odyssey",
  34: "Duality", 35: "Trifecta", 36: "Quadrant", 37: "Constellation", 38: "Cyber Echo", 39: "Zenith", 40: "ZenMaster", 41: "Total Eclipse",
};

// Helper to record transaction in database
async function recordTransaction(
  supabaseClient: any,
  userId: string,
  txHash: string,
  blockNumber: string,
  action: string,
  walletAddress: string,
  tokensMinted: number = 0,
  nftsMinted: number[] = [],
  status: string = "confirmed"
) {
  try {
    const nftNames = nftsMinted.map(id => NFT_NAMES[id] || `Token #${id}`);
    
    await supabaseClient.from("mint_transactions").insert({
      user_id: userId,
      tx_hash: txHash,
      block_number: blockNumber,
      action,
      wallet_address: walletAddress,
      tokens_minted: tokensMinted,
      nfts_minted: nftsMinted,
      nft_names: nftNames,
      status,
    });
    console.log("Transaction recorded:", txHash);
  } catch (error) {
    console.error("Failed to record transaction:", error);
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

    console.log("Minter wallet address:", account.address);

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

    const body = await req.json();
    const { action, walletAddress, tokenIds, comboTypes, solarDelta, evMilesDelta, batteryDelta, chargingDelta } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({ error: "Wallet address required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return new Response(JSON.stringify({ error: "Invalid wallet address format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${action} for user ${user.id}, wallet ${walletAddress}`);

    const minterBalance = await publicClient.getBalance({ address: account.address });
    console.log("Minter ETH balance:", formatEther(minterBalance));
    
    if (minterBalance < BigInt(1e15)) {
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

      console.log("Registering user and minting Welcome NFT...");
      const hash = await walletClient.writeContract({
        address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
        abi: CONTROLLER_ABI,
        functionName: "registerUser",
        args: [walletAddress as `0x${string}`],
      });

      console.log("Register tx hash:", hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Register tx confirmed, status:", receipt.status);

      // Record transaction
      if (receipt.status === "success") {
        await recordTransaction(
          supabaseClient,
          user.id,
          hash,
          receipt.blockNumber.toString(),
          "register",
          walletAddress,
          0,
          [0] // Welcome NFT token ID
        );
      }

      return new Response(JSON.stringify({
        success: receipt.status === "success",
        txHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        nftsMinted: [0],
        nftNames: ["Welcome"],
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

      // Get NFTs before minting to compare after
      const nftsBefore = await publicClient.readContract({
        address: ZSOLAR_NFT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: "getOwnedTokens",
        args: [walletAddress as `0x${string}`],
      }) as bigint[];
      const nftsBeforeSet = new Set(nftsBefore.map(id => Number(id)));

      console.log(`Minting rewards: solar=${solar}, evMiles=${evMiles}, battery=${battery}, charging=${charging}`);

      const hash = await walletClient.writeContract({
        address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
        abi: CONTROLLER_ABI,
        functionName: "mintRewards",
        args: [walletAddress as `0x${string}`, solar, evMiles, battery, charging],
      });

      console.log("Mint rewards tx hash:", hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Mint rewards tx confirmed, status:", receipt.status);

      const expectedTokens = Number(totalUnits) * 0.93;
      let newNfts: number[] = [];

      // Get NFTs after minting to see what was minted
      if (receipt.status === "success") {
        const nftsAfter = await publicClient.readContract({
          address: ZSOLAR_NFT_ADDRESS as `0x${string}`,
          abi: NFT_ABI,
          functionName: "getOwnedTokens",
          args: [walletAddress as `0x${string}`],
        }) as bigint[];
        
        newNfts = nftsAfter.map(id => Number(id)).filter(id => !nftsBeforeSet.has(id));
        
        await recordTransaction(
          supabaseClient,
          user.id,
          hash,
          receipt.blockNumber.toString(),
          "mint-rewards",
          walletAddress,
          expectedTokens,
          newNfts
        );
      }

      return new Response(JSON.stringify({
        success: receipt.status === "success",
        txHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        tokensEstimate: expectedTokens,
        nftsMinted: newNfts,
        nftNames: newNfts.map(id => NFT_NAMES[id] || `Token #${id}`),
        message: receipt.status === "success" 
          ? `Minted ~${expectedTokens.toFixed(0)} $ZSOLAR tokens${newNfts.length > 0 ? ` + ${newNfts.length} NFT(s)!` : '!'}` 
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
        args: [walletAddress as `0x${string}`, tokenIds.map(id => BigInt(id)), comboTypes],
      });

      console.log("Mint combos tx hash:", hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Mint combos tx confirmed, status:", receipt.status);

      if (receipt.status === "success") {
        await recordTransaction(
          supabaseClient,
          user.id,
          hash,
          receipt.blockNumber.toString(),
          "mint-combos",
          walletAddress,
          0,
          tokenIds
        );
      }

      return new Response(JSON.stringify({
        success: receipt.status === "success",
        txHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        mintedCount: tokenIds.length,
        nftsMinted: tokenIds,
        nftNames: tokenIds.map(id => NFT_NAMES[id] || `Token #${id}`),
        message: receipt.status === "success" 
          ? `Minted ${tokenIds.length} combo NFT(s)!` 
          : "Transaction failed",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: Check which NFTs user is eligible for
    if (action === "check-eligible") {
      const userStats = await publicClient.readContract({
        address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
        abi: CONTROLLER_ABI,
        functionName: "getUserStats",
        args: [walletAddress as `0x${string}`],
      }) as [bigint, bigint, bigint, bigint, boolean];

      const [solar, evMiles, battery, charging, hasWelcome] = userStats;

      const ownedNFTs = await publicClient.readContract({
        address: ZSOLAR_NFT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: "getOwnedTokens",
        args: [walletAddress as `0x${string}`],
      }) as bigint[];

      const ownedSet = new Set(ownedNFTs.map(id => Number(id)));

      const eligibleNFTs: { tokenId: number; category: string; name: string; threshold: number }[] = [];
      
      const solarThresholds = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
      const solarNames = ["Sunspark", "Photonic", "Rayforge", "Solaris", "Helios", "Sunforge", "Gigasun", "Starforge"];
      for (let i = 0; i < solarThresholds.length; i++) {
        const tokenId = i + 1;
        if (Number(solar) >= solarThresholds[i] && !ownedSet.has(tokenId)) {
          eligibleNFTs.push({ tokenId, category: "solar", name: solarNames[i], threshold: solarThresholds[i] });
        }
      }

      const batteryThresholds = [500, 1000, 2500, 5000, 10000, 25000, 50000];
      const batteryNames = ["Voltbank", "Gridpulse", "Megacell", "Reservex", "Dynamax", "Ultracell", "Gigavolt"];
      for (let i = 0; i < batteryThresholds.length; i++) {
        const tokenId = i + 9;
        if (Number(battery) >= batteryThresholds[i] && !ownedSet.has(tokenId)) {
          eligibleNFTs.push({ tokenId, category: "battery", name: batteryNames[i], threshold: batteryThresholds[i] });
        }
      }

      const chargingThresholds = [100, 500, 1000, 1500, 2500, 5000, 10000, 25000];
      const chargingNames = ["Ignite", "Voltcharge", "Kilovolt", "Ampforge", "Chargeon", "Gigacharge", "Megacharge", "Teracharge"];
      for (let i = 0; i < chargingThresholds.length; i++) {
        const tokenId = i + 16;
        if (Number(charging) >= chargingThresholds[i] && !ownedSet.has(tokenId)) {
          eligibleNFTs.push({ tokenId, category: "charging", name: chargingNames[i], threshold: chargingThresholds[i] });
        }
      }

      const evMilesThresholds = [100, 500, 1000, 5000, 10000, 25000, 50000, 100000, 150000, 200000];
      const evMilesNames = ["Ignitor", "Velocity", "Autobahn", "Hyperdrive", "Electra", "Velocity Pro", "Mach One", "Centaurion", "Voyager", "Odyssey"];
      for (let i = 0; i < evMilesThresholds.length; i++) {
        const tokenId = i + 24;
        if (Number(evMiles) >= evMilesThresholds[i] && !ownedSet.has(tokenId)) {
          eligibleNFTs.push({ tokenId, category: "ev", name: evMilesNames[i], threshold: evMilesThresholds[i] });
        }
      }

      const solarCount = solarThresholds.filter((t, i) => Number(solar) >= t && ownedSet.has(i + 1)).length;
      const batteryCount = batteryThresholds.filter((t, i) => Number(battery) >= t && ownedSet.has(i + 9)).length;
      const chargingCount = chargingThresholds.filter((t, i) => Number(charging) >= t && ownedSet.has(i + 16)).length;
      const evMilesCount = evMilesThresholds.filter((t, i) => Number(evMiles) >= t && ownedSet.has(i + 24)).length;

      const categoriesWithNFTs = [solarCount > 0, batteryCount > 0, chargingCount > 0, evMilesCount > 0].filter(Boolean).length;
      const totalCategoryNFTs = solarCount + batteryCount + chargingCount + evMilesCount;
      
      const solarMaxed = solarCount === solarThresholds.length;
      const batteryMaxed = batteryCount === batteryThresholds.length;
      const chargingMaxed = chargingCount === chargingThresholds.length;
      const evMilesMaxed = evMilesCount === evMilesThresholds.length;
      const categoriesMaxed = [solarMaxed, batteryMaxed, chargingMaxed, evMilesMaxed].filter(Boolean).length;

      const eligibleCombos: { tokenId: number; name: string; comboType: string }[] = [];
      if (categoriesWithNFTs >= 2 && !ownedSet.has(34)) eligibleCombos.push({ tokenId: 34, name: "Duality", comboType: "2 categories" });
      if (categoriesWithNFTs >= 3 && !ownedSet.has(35)) eligibleCombos.push({ tokenId: 35, name: "Trifecta", comboType: "3 categories" });
      if (totalCategoryNFTs >= 5 && !ownedSet.has(36)) eligibleCombos.push({ tokenId: 36, name: "Quadrant", comboType: "5 total NFTs" });
      if (totalCategoryNFTs >= 10 && !ownedSet.has(37)) eligibleCombos.push({ tokenId: 37, name: "Constellation", comboType: "10 total NFTs" });
      if (totalCategoryNFTs >= 20 && !ownedSet.has(38)) eligibleCombos.push({ tokenId: 38, name: "Cyber Echo", comboType: "20 total NFTs" });
      if (totalCategoryNFTs >= 30 && !ownedSet.has(39)) eligibleCombos.push({ tokenId: 39, name: "Zenith", comboType: "30 total NFTs" });
      if (categoriesMaxed >= 1 && !ownedSet.has(40)) eligibleCombos.push({ tokenId: 40, name: "ZenMaster", comboType: "Max 1 category" });
      if (categoriesMaxed >= 4 && !ownedSet.has(41)) eligibleCombos.push({ tokenId: 41, name: "Total Eclipse", comboType: "Max all categories" });

      return new Response(JSON.stringify({
        walletAddress,
        hasWelcomeNFT: hasWelcome,
        onChainStats: {
          solarKwh: Number(solar),
          evMiles: Number(evMiles),
          batteryKwh: Number(battery),
          chargingKwh: Number(charging),
        },
        ownedNFTs: Array.from(ownedSet),
        eligibleMilestoneNFTs: eligibleNFTs,
        eligibleComboNFTs: eligibleCombos,
        totalEligible: eligibleNFTs.length + eligibleCombos.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: Claim milestone NFTs
    if (action === "claim-milestone-nfts") {
      console.log("Claiming eligible milestone NFTs for:", walletAddress);

      const nftsBefore = await publicClient.readContract({
        address: ZSOLAR_NFT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: "getOwnedTokens",
        args: [walletAddress as `0x${string}`],
      }) as bigint[];
      const nftsBeforeSet = new Set(nftsBefore.map(id => Number(id)));

      const hash = await walletClient.writeContract({
        address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
        abi: CONTROLLER_ABI,
        functionName: "mintRewards",
        args: [walletAddress as `0x${string}`, BigInt(0), BigInt(0), BigInt(0), BigInt(0)],
      });

      console.log("Claim milestone NFTs tx hash:", hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Claim milestone NFTs tx confirmed, status:", receipt.status);

      let newNfts: number[] = [];
      if (receipt.status === "success") {
        const nftsAfter = await publicClient.readContract({
          address: ZSOLAR_NFT_ADDRESS as `0x${string}`,
          abi: NFT_ABI,
          functionName: "getOwnedTokens",
          args: [walletAddress as `0x${string}`],
        }) as bigint[];
        
        newNfts = nftsAfter.map(id => Number(id)).filter(id => !nftsBeforeSet.has(id));

        if (newNfts.length > 0) {
          await recordTransaction(
            supabaseClient,
            user.id,
            hash,
            receipt.blockNumber.toString(),
            "claim-milestone-nfts",
            walletAddress,
            0,
            newNfts
          );
        }
      }

      return new Response(JSON.stringify({
        success: receipt.status === "success",
        txHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        nftsMinted: newNfts,
        nftNames: newNfts.map(id => NFT_NAMES[id] || `Token #${id}`),
        message: receipt.status === "success" 
          ? newNfts.length > 0 
            ? `Claimed ${newNfts.length} milestone NFT(s)!`
            : "No new NFTs to claim."
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

      const ownedIds = (ownedNFTs as bigint[]).map(id => Number(id));

      return new Response(JSON.stringify({
        walletAddress,
        hasWelcomeNFT: hasWelcome,
        zsolarBalance: formatEther(tokenBalance as bigint),
        ownedNFTTokenIds: ownedIds,
        ownedNFTNames: ownedIds.map(id => NFT_NAMES[id] || `Token #${id}`),
        nftCount: ownedIds.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      error: "Invalid action. Use: register, mint-rewards, mint-combos, claim-milestone-nfts, check-eligible, status" 
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Mint on-chain error:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
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