import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createWalletClient, createPublicClient, http, parseAbi, formatEther, decodeErrorResult } from "npm:viem@2.43.5";
import { privateKeyToAccount } from "npm:viem@2.43.5/accounts";
import { baseSepolia } from "npm:viem@2.43.5/chains";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Contract addresses (Base Sepolia - fresh deployment 2026-01-16)
const ZSOLAR_TOKEN_ADDRESS = "0x9bcf687eee0AF5f8C81F69812E3d7aC2cfCe410E";
const ZSOLAR_NFT_ADDRESS = "0x63ef4BEF238a1E91740dA5aB11Ae1E7D319EFC4C";
const ZENSOLAR_CONTROLLER_ADDRESS = "0x3763B402b7f3Bd407B5141C55C94a1076f220cE7";

// ZenSolar Controller ABI (only the functions we need)
const CONTROLLER_ABI = parseAbi([
  "function registerUser(address user) external",
  "function mintRewards(address user, uint256 solarDeltaKwh, uint256 evMilesDelta, uint256 batteryDeltaKwh, uint256 chargingDeltaKwh) external",
  "function mintComboNFT(address user, uint256 comboTokenId, string memory comboType) external",
  "function mintComboNFTBatch(address user, uint256[] calldata comboTokenIds, string[] calldata comboTypes) external",
  "function hasWelcomeNFT(address user) external view returns (bool)",
  "function getUserStats(address user) external view returns (uint256 solar, uint256 evMiles, uint256 battery, uint256 charging, bool hasWelcome)",
  "function owner() external view returns (address)",
  "function zSolarToken() external view returns (address)",
  "function zenSolarNFT() external view returns (address)",
]);

// ZSOLAR Token ABI
const TOKEN_ABI = parseAbi([
  "function balanceOf(address account) external view returns (uint256)",
  "function owner() external view returns (address)",
]);

// ZenSolarNFT ABI
const NFT_ABI = parseAbi([
  "function hasToken(address user, uint256 tokenId) external view returns (bool)",
  "function getOwnedTokens(address user) external view returns (uint256[])",
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

// Helper to safely get owned NFTs (handles contract revert for new wallets)
async function safeGetOwnedTokens(
  publicClient: any, 
  walletAddress: string
): Promise<bigint[]> {
  try {
    const ownedNFTs = await publicClient.readContract({
      address: ZSOLAR_NFT_ADDRESS as `0x${string}`,
      abi: NFT_ABI,
      functionName: "getOwnedTokens",
      args: [walletAddress as `0x${string}`],
    });
    return ownedNFTs as bigint[];
  } catch (error) {
    console.log("getOwnedTokens reverted (wallet may not have any NFTs yet):", walletAddress);
    return [];
  }
}

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

    const body = await req.json();
    const { action } = body;

    // Public health-check action (no auth required)
    if (action === "public-health-check") {
      try {
        console.log("Running public contract health check...");
        
        const [controllerOwner, tokenOwner, nftOwner] = await Promise.all([
          publicClient.readContract({
            address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
            abi: CONTROLLER_ABI,
            functionName: "owner",
          }),
          publicClient.readContract({
            address: ZSOLAR_TOKEN_ADDRESS as `0x${string}`,
            abi: TOKEN_ABI,
            functionName: "owner",
          }),
          publicClient.readContract({
            address: ZSOLAR_NFT_ADDRESS as `0x${string}`,
            abi: NFT_ABI,
            functionName: "owner",
          }),
        ]);

        const [configuredToken, configuredNft] = await Promise.all([
          publicClient.readContract({
            address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
            abi: CONTROLLER_ABI,
            functionName: "zSolarToken",
          }),
          publicClient.readContract({
            address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
            abi: CONTROLLER_ABI,
            functionName: "zenSolarNFT",
          }),
        ]);

        const minterBalance = await publicClient.getBalance({ address: account.address });

        const issues: string[] = [];

        if ((controllerOwner as string).toLowerCase() !== account.address.toLowerCase()) {
          issues.push(
            `Controller owner mismatch: ${controllerOwner} (owner) != ${account.address} (backend signer). Transfer ownership to the signer wallet to enable minting.`
          );
        }
        
        if ((tokenOwner as string).toLowerCase() !== ZENSOLAR_CONTROLLER_ADDRESS.toLowerCase()) {
          issues.push(`ZSOLAR token owner mismatch: ${tokenOwner} should be ${ZENSOLAR_CONTROLLER_ADDRESS}`);
        }
        
        if ((nftOwner as string).toLowerCase() !== ZENSOLAR_CONTROLLER_ADDRESS.toLowerCase()) {
          issues.push(`NFT owner mismatch: ${nftOwner} should be ${ZENSOLAR_CONTROLLER_ADDRESS}`);
        }

        if ((configuredToken as string).toLowerCase() !== ZSOLAR_TOKEN_ADDRESS.toLowerCase()) {
          issues.push(`Controller token address mismatch`);
        }

        if ((configuredNft as string).toLowerCase() !== ZSOLAR_NFT_ADDRESS.toLowerCase()) {
          issues.push(`Controller NFT address mismatch`);
        }

        if (minterBalance < BigInt(1e15)) {
          issues.push(`Minter wallet low on ETH: ${formatEther(minterBalance)} ETH`);
        }

        return new Response(JSON.stringify({
          healthy: issues.length === 0,
          issues,
          contracts: {
            controller: ZENSOLAR_CONTROLLER_ADDRESS,
            token: ZSOLAR_TOKEN_ADDRESS,
            nft: ZSOLAR_NFT_ADDRESS,
          },
          ownership: {
            controllerOwner,
            tokenOwner,
            nftOwner,
            tokenOwnedByController: (tokenOwner as string).toLowerCase() === ZENSOLAR_CONTROLLER_ADDRESS.toLowerCase(),
            nftOwnedByController: (nftOwner as string).toLowerCase() === ZENSOLAR_CONTROLLER_ADDRESS.toLowerCase(),
          },
          minter: {
            address: account.address,
            balanceEth: formatEther(minterBalance),
          },
          tokenInfo: {
            address: ZSOLAR_TOKEN_ADDRESS,
            symbol: "ZSOLAR",
            decimals: 18,
          },
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error: any) {
        console.error("Public health check failed:", error);
        return new Response(JSON.stringify({ 
          healthy: false, 
          error: error.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

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

    const { walletAddress, tokenIds, comboTypes, category } = body;

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

    // Guardrail: actions that write to chain require the controller owner to match
    // the backend signer (MINTER_PRIVATE_KEY derived address).
    const ownerRequiredActions = new Set([
      "register",
      "mint-rewards",
      "mint-combos",
      "claim-milestone-nfts",
      "mint-specific-nft",
    ]);

    if (ownerRequiredActions.has(action)) {
      const controllerOwner = await publicClient.readContract({
        address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
        abi: CONTROLLER_ABI,
        functionName: "owner",
      });

      if ((controllerOwner as string).toLowerCase() !== account.address.toLowerCase()) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "owner_mismatch",
            message: `Contract owner mismatch. Current controller owner is ${controllerOwner}, but backend signer is ${account.address}. Transfer ownership from ${controllerOwner} to ${account.address} (recommended), or update MINTER_PRIVATE_KEY to match the current owner.`,
            controller: {
              address: ZENSOLAR_CONTROLLER_ADDRESS,
              owner: controllerOwner,
            },
            signer: {
              address: account.address,
            },
          }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

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
      console.log("Checking if user has Welcome NFT...");
      const hasWelcome = await publicClient.readContract({
        address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
        abi: CONTROLLER_ABI,
        functionName: "hasWelcomeNFT",
        args: [walletAddress as `0x${string}`],
      });
      console.log("hasWelcomeNFT result:", hasWelcome);

      if (hasWelcome) {
        console.log("User already registered, skipping registration");
        return new Response(JSON.stringify({ 
          success: true, 
          message: "User already registered with Welcome NFT",
          alreadyRegistered: true,
          hasWelcome: true
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
    // Supports category-based minting: 'solar', 'ev_miles', 'battery', 'charging', or 'all' (default)
    if (action === "mint-rewards") {
      const mintCategory = category || 'all'; // 'solar', 'ev_miles', 'battery', 'charging', 'all'
      console.log(`Minting rewards for category: ${mintCategory}`);

      // First check if user is registered (has Welcome NFT)
      const hasWelcome = await publicClient.readContract({
        address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
        abi: CONTROLLER_ABI,
        functionName: "hasWelcomeNFT",
        args: [walletAddress as `0x${string}`],
      });

      if (!hasWelcome) {
        console.log("User not registered, cannot mint rewards without Welcome NFT");
        return new Response(JSON.stringify({ 
          success: false, 
          error: "not_registered",
          message: "Please register first. Your wallet needs a Welcome NFT before minting tokens.",
          requiresRegistration: true
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get device breakdown from connected_devices to calculate real deltas
      const { data: devices } = await supabaseClient
        .from("connected_devices")
        .select("id, device_type, provider, baseline_data, lifetime_totals")
        .eq("user_id", user.id);

      let solarDeltaKwh = 0;
      let evMilesDelta = 0;
      let batteryDeltaKwh = 0;
      let chargingDeltaKwh = 0;
      const deviceIdsToUpdate: string[] = [];

      // Calculate real deltas from device data, filtering by category
      for (const device of (devices || [])) {
        const baseline = device.baseline_data as Record<string, number> | null;
        const lifetime = device.lifetime_totals as Record<string, number> | null;
        
        if (!lifetime) continue;

        if (device.device_type === "solar" && (mintCategory === 'all' || mintCategory === 'solar')) {
          const lifetimeSolarWh = lifetime.solar_wh || lifetime.lifetime_solar_wh || 0;
          const baselineSolarWh = baseline?.total_solar_produced_wh || baseline?.solar_wh || 0;
          const delta = Math.max(0, Math.floor((lifetimeSolarWh - baselineSolarWh) / 1000));
          if (delta > 0) {
            solarDeltaKwh += delta;
            deviceIdsToUpdate.push(device.id);
          }
        } else if ((device.device_type === "powerwall" || device.device_type === "battery") && (mintCategory === 'all' || mintCategory === 'battery')) {
          const lifetimeBatteryWh = lifetime.battery_discharge_wh || lifetime.lifetime_battery_discharge_wh || 0;
          const baselineBatteryWh = baseline?.total_energy_discharged_wh || baseline?.battery_discharge_wh || 0;
          const delta = Math.max(0, Math.floor((lifetimeBatteryWh - baselineBatteryWh) / 1000));
          if (delta > 0) {
            batteryDeltaKwh += delta;
            deviceIdsToUpdate.push(device.id);
          }
        } else if (device.device_type === "vehicle") {
          // Vehicle has both EV miles and charging
          if (mintCategory === 'all' || mintCategory === 'ev_miles') {
            const lifetimeOdometer = lifetime.odometer || 0;
            const baselineOdometer = baseline?.odometer || 0;
            const delta = Math.max(0, Math.floor(lifetimeOdometer - baselineOdometer));
            if (delta > 0) {
              evMilesDelta += delta;
              if (!deviceIdsToUpdate.includes(device.id)) {
                deviceIdsToUpdate.push(device.id);
              }
            }
          }
          
          if (mintCategory === 'all' || mintCategory === 'charging') {
            const lifetimeChargingWh = lifetime.charging_wh || 0;
            const baselineChargingWh = baseline?.charging_wh || 0;
            const delta = Math.max(0, Math.floor((lifetimeChargingWh - baselineChargingWh) / 1000));
            if (delta > 0) {
              chargingDeltaKwh += delta;
              if (!deviceIdsToUpdate.includes(device.id)) {
                deviceIdsToUpdate.push(device.id);
              }
            }
          }
        } else if (device.device_type === "wall_connector" && (mintCategory === 'all' || mintCategory === 'charging')) {
          const lifetimeChargingWh = lifetime.charging_wh || lifetime.lifetime_charging_wh || 0;
          const baselineChargingWh = baseline?.charging_wh || 0;
          const delta = Math.max(0, Math.floor((lifetimeChargingWh - baselineChargingWh) / 1000));
          if (delta > 0) {
            chargingDeltaKwh += delta;
            deviceIdsToUpdate.push(device.id);
          }
        }
      }

      const solar = BigInt(solarDeltaKwh);
      const evMiles = BigInt(evMilesDelta);
      const battery = BigInt(batteryDeltaKwh);
      const charging = BigInt(chargingDeltaKwh);

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
      const nftsBefore = await safeGetOwnedTokens(publicClient, walletAddress);
      const nftsBeforeSet = new Set(nftsBefore.map(id => Number(id)));

      console.log(`Minting rewards: solar=${solar}, evMiles=${evMiles}, battery=${battery}, charging=${charging}`);

      // Simulate the transaction first to catch errors before sending
      try {
        await publicClient.simulateContract({
          address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
          abi: CONTROLLER_ABI,
          functionName: "mintRewards",
          args: [walletAddress as `0x${string}`, solar, evMiles, battery, charging],
          account: account.address,
        });
        console.log("Simulation passed, proceeding with transaction");
      } catch (simError: any) {
        console.error("Simulation failed:", simError);
        
        // Try to extract a meaningful error message
        let errorMessage = "Contract simulation failed";
        if (simError?.cause?.reason) {
          errorMessage = simError.cause.reason;
        } else if (simError?.shortMessage) {
          errorMessage = simError.shortMessage;
        } else if (simError?.message) {
          errorMessage = simError.message.substring(0, 200);
        }
        
        return new Response(JSON.stringify({ 
          success: false, 
          error: "simulation_failed",
          message: `Transaction would fail: ${errorMessage}`,
          details: "This usually means the controller contract doesn't have permission to mint tokens. Contact support."
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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
        const nftsAfter = await safeGetOwnedTokens(publicClient, walletAddress);
        
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

        // Update baselines only for devices that were minted
        if (deviceIdsToUpdate.length > 0) {
          const now = new Date().toISOString();
          for (const device of (devices || [])) {
            if (!deviceIdsToUpdate.includes(device.id)) continue;
            const lifetime = device.lifetime_totals as Record<string, any> | null;
            if (lifetime) {
              await supabaseClient
                .from("connected_devices")
                .update({ 
                  baseline_data: { ...lifetime, captured_at: now },
                  last_minted_at: now 
                })
                .eq("id", device.id);
            }
          }
          console.log(`Updated baselines for ${deviceIdsToUpdate.length} devices`);
        }

        // Update baselines on devices
        if (devices && devices.length > 0) {
          const now = new Date().toISOString();
          for (const device of devices) {
            const lifetime = device.lifetime_totals as Record<string, any> | null;
            if (lifetime) {
              await supabaseClient
                .from("connected_devices")
                .update({ 
                  baseline_data: { ...lifetime, captured_at: now },
                  last_minted_at: now 
                })
                .eq("user_id", user.id)
                .eq("device_type", device.device_type)
                .eq("provider", device.provider);
            }
          }
          console.log(`Updated baselines for ${devices.length} devices`);
        }
      }

      return new Response(JSON.stringify({
        success: receipt.status === "success",
        txHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        tokensEstimate: expectedTokens,
        tokensMinted: Number(totalUnits),
        nftsMinted: newNfts,
        nftNames: newNfts.map(id => NFT_NAMES[id] || `Token #${id}`),
        message: receipt.status === "success" 
          ? `Minted ~${expectedTokens.toFixed(0)} $ZSOLAR tokens${newNfts.length > 0 ? ` + ${newNfts.length} NFT(s)!` : '!'}` 
          : "Transaction failed",
        breakdown: {
          solarKwh: Number(solar),
          evMiles: Number(evMiles),
          batteryKwh: Number(battery),
          chargingKwh: Number(charging),
        }
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

      const ownedNFTs = await safeGetOwnedTokens(publicClient, walletAddress);

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

      const nftsBefore = await safeGetOwnedTokens(publicClient, walletAddress);
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
        const nftsAfter = await safeGetOwnedTokens(publicClient, walletAddress);
        
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

    // Action: Mint a specific NFT by token ID
    if (action === "mint-specific-nft") {
      const { tokenId } = body;
      
      if (tokenId === undefined || tokenId === null) {
        return new Response(JSON.stringify({ error: "tokenId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Minting specific NFT tokenId ${tokenId} for:`, walletAddress);

      // Check if user already owns this NFT
      const hasToken = await publicClient.readContract({
        address: ZSOLAR_NFT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: "hasToken",
        args: [walletAddress as `0x${string}`, BigInt(tokenId)],
      });

      if (hasToken) {
        return new Response(JSON.stringify({
          success: false,
          alreadyOwned: true,
          message: `You already own ${NFT_NAMES[tokenId] || `Token #${tokenId}`}`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Determine what type of NFT this is
      if (tokenId === 0) {
        // Welcome NFT - use register
        const hash = await walletClient.writeContract({
          address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
          abi: CONTROLLER_ABI,
          functionName: "registerUser",
          args: [walletAddress as `0x${string}`],
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        if (receipt.status === "success") {
          await recordTransaction(
            supabaseClient,
            user.id,
            hash,
            receipt.blockNumber.toString(),
            "mint-specific-nft",
            walletAddress,
            0,
            [0]
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
      } else if (tokenId >= 34 && tokenId <= 41) {
        // Combo NFT - use mintComboNFT
        const comboTypeMap: Record<number, string> = {
          34: "2 categories",
          35: "3 categories", 
          36: "5 total NFTs",
          37: "10 total NFTs",
          38: "20 total NFTs",
          39: "30 total NFTs",
          40: "Max 1 category",
          41: "Max all categories",
        };

        const hash = await walletClient.writeContract({
          address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
          abi: CONTROLLER_ABI,
          functionName: "mintComboNFT",
          args: [walletAddress as `0x${string}`, BigInt(tokenId), comboTypeMap[tokenId]],
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        if (receipt.status === "success") {
          await recordTransaction(
            supabaseClient,
            user.id,
            hash,
            receipt.blockNumber.toString(),
            "mint-specific-nft",
            walletAddress,
            0,
            [tokenId]
          );
        }

        return new Response(JSON.stringify({
          success: receipt.status === "success",
          txHash: hash,
          blockNumber: receipt.blockNumber.toString(),
          nftsMinted: [tokenId],
          nftNames: [NFT_NAMES[tokenId] || `Token #${tokenId}`],
          message: receipt.status === "success" 
            ? `${NFT_NAMES[tokenId]} NFT minted successfully!` 
            : "Transaction failed",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Milestone NFT (1-33) - trigger mintRewards with 0 delta to claim eligible NFTs
        const nftsBefore = await safeGetOwnedTokens(publicClient, walletAddress);
        const nftsBeforeSet = new Set(nftsBefore.map(id => Number(id)));

        const hash = await walletClient.writeContract({
          address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
          abi: CONTROLLER_ABI,
          functionName: "mintRewards",
          args: [walletAddress as `0x${string}`, BigInt(0), BigInt(0), BigInt(0), BigInt(0)],
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        let newNfts: number[] = [];
        if (receipt.status === "success") {
          const nftsAfter = await safeGetOwnedTokens(publicClient, walletAddress);
          
          newNfts = nftsAfter.map(id => Number(id)).filter(id => !nftsBeforeSet.has(id));

          if (newNfts.length > 0) {
            await recordTransaction(
              supabaseClient,
              user.id,
              hash,
              receipt.blockNumber.toString(),
              "mint-specific-nft",
              walletAddress,
              0,
              newNfts
            );
          }
        }

        const mintedTarget = newNfts.includes(tokenId);
        
        return new Response(JSON.stringify({
          success: receipt.status === "success" && mintedTarget,
          txHash: hash,
          blockNumber: receipt.blockNumber.toString(),
          nftsMinted: newNfts,
          nftNames: newNfts.map(id => NFT_NAMES[id] || `Token #${id}`),
          message: receipt.status === "success" 
            ? mintedTarget 
              ? `${NFT_NAMES[tokenId]} minted successfully!`
              : newNfts.length > 0 
                ? `Minted ${newNfts.length} NFT(s), but ${NFT_NAMES[tokenId]} was not eligible.`
                : `${NFT_NAMES[tokenId]} is not eligible yet. Increase your activity!`
            : "Transaction failed",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "status") {
      try {
        const [hasWelcome, tokenBalance] = await Promise.all([
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
        ]);
        
        const ownedNFTs = await safeGetOwnedTokens(publicClient, walletAddress);
        const ownedIds = ownedNFTs.map(id => Number(id));

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
      } catch (statusError) {
        // If contract calls fail (wallet not registered), return empty state
        console.log("Status check failed, wallet may not be registered:", statusError);
        return new Response(JSON.stringify({
          walletAddress,
          hasWelcomeNFT: false,
          zsolarBalance: "0",
          ownedNFTTokenIds: [],
          ownedNFTNames: [],
          nftCount: 0,
          notRegistered: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Action: Health check - verify contract ownership and wiring
    if (action === "health-check") {
      try {
        console.log("Running contract health check...");
        
        // Get owners of all contracts
        const [controllerOwner, tokenOwner, nftOwner] = await Promise.all([
          publicClient.readContract({
            address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
            abi: CONTROLLER_ABI,
            functionName: "owner",
          }),
          publicClient.readContract({
            address: ZSOLAR_TOKEN_ADDRESS as `0x${string}`,
            abi: TOKEN_ABI,
            functionName: "owner",
          }),
          publicClient.readContract({
            address: ZSOLAR_NFT_ADDRESS as `0x${string}`,
            abi: NFT_ABI,
            functionName: "owner",
          }),
        ]);

        // Get controller's configured contract addresses
        const [configuredToken, configuredNft] = await Promise.all([
          publicClient.readContract({
            address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
            abi: CONTROLLER_ABI,
            functionName: "zSolarToken",
          }),
          publicClient.readContract({
            address: ZENSOLAR_CONTROLLER_ADDRESS as `0x${string}`,
            abi: CONTROLLER_ABI,
            functionName: "zenSolarNFT",
          }),
        ]);

        const issues: string[] = [];
        
        // Check if controller owns the token contract
        if ((tokenOwner as string).toLowerCase() !== ZENSOLAR_CONTROLLER_ADDRESS.toLowerCase()) {
          issues.push(`ZSOLAR token owner is ${tokenOwner}, but should be controller ${ZENSOLAR_CONTROLLER_ADDRESS}`);
        }
        
        // Check if controller owns the NFT contract
        if ((nftOwner as string).toLowerCase() !== ZENSOLAR_CONTROLLER_ADDRESS.toLowerCase()) {
          issues.push(`ZenSolarNFT owner is ${nftOwner}, but should be controller ${ZENSOLAR_CONTROLLER_ADDRESS}`);
        }

        // Check if controller has correct token address configured
        if ((configuredToken as string).toLowerCase() !== ZSOLAR_TOKEN_ADDRESS.toLowerCase()) {
          issues.push(`Controller's token address is ${configuredToken}, but should be ${ZSOLAR_TOKEN_ADDRESS}`);
        }

        // Check if controller has correct NFT address configured
        if ((configuredNft as string).toLowerCase() !== ZSOLAR_NFT_ADDRESS.toLowerCase()) {
          issues.push(`Controller's NFT address is ${configuredNft}, but should be ${ZSOLAR_NFT_ADDRESS}`);
        }

        // Check minter wallet balance
        const minterBalance = await publicClient.getBalance({ address: account.address });
        if (minterBalance < BigInt(1e15)) {
          issues.push(`Minter wallet low on ETH: ${formatEther(minterBalance)} ETH`);
        }

        const isHealthy = issues.length === 0;

        console.log("Health check result:", { isHealthy, issues });

        return new Response(JSON.stringify({
          healthy: isHealthy,
          issues,
          contracts: {
            controller: {
              address: ZENSOLAR_CONTROLLER_ADDRESS,
              owner: controllerOwner,
            },
            token: {
              address: ZSOLAR_TOKEN_ADDRESS,
              owner: tokenOwner,
              configuredInController: configuredToken,
              ownershipCorrect: (tokenOwner as string).toLowerCase() === ZENSOLAR_CONTROLLER_ADDRESS.toLowerCase(),
            },
            nft: {
              address: ZSOLAR_NFT_ADDRESS,
              owner: nftOwner,
              configuredInController: configuredNft,
              ownershipCorrect: (nftOwner as string).toLowerCase() === ZENSOLAR_CONTROLLER_ADDRESS.toLowerCase(),
            },
          },
          minter: {
            address: account.address,
            balance: formatEther(minterBalance),
          },
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (healthError) {
        console.error("Health check failed:", healthError);
        return new Response(JSON.stringify({
          healthy: false,
          error: "Health check failed",
          details: healthError instanceof Error ? healthError.message : String(healthError),
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ 
      error: "Invalid action. Use: register, mint-rewards, mint-combos, claim-milestone-nfts, check-eligible, status, health-check" 
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