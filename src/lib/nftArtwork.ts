// NFT Artwork mapping - maps milestone IDs to their generated images
// Updated: January 14, 2026 - Aligned with final_milestones-3.docx (42 NFTs total)

// Welcome NFT
import welcomeNft from '@/assets/nft/solar-genesis.png';

// Solar NFTs (8 tiers)
import solarSunspark from '@/assets/nft/solar-sunlink.png';
import solarPhotonic from '@/assets/nft/solar-photon.png';
import solarRayforge from '@/assets/nft/solar-rayfield.png';
import solarSolaris from '@/assets/nft/solar-solarflare.png';
import solarHelios from '@/assets/nft/solar-heliogen.png';
import solarSunforge from '@/assets/nft/solar-sunvault.png';
import solarGigasun from '@/assets/nft/solar-gigasol.png';
import solarStarforge from '@/assets/nft/solar-starpower.png';

// Battery NFTs (7 tiers)
import batteryVoltbank from '@/assets/nft/battery-powerwall.png';
import batteryGridpulse from '@/assets/nft/battery-gridlink.png';
import batteryMegacell from '@/assets/nft/battery-megapack.png';
import batteryReservex from '@/assets/nft/battery-reservoir.png';
import batteryDynamax from '@/assets/nft/battery-dynamo.png';
import batteryUltracell from '@/assets/nft/battery-gigabank.png';
import batteryGigavolt from '@/assets/nft/battery-ultrabank.png';

// EV Charging NFTs (8 tiers)
import chargeIgnite from '@/assets/nft/charge-spark.png';
import chargeVoltcharge from '@/assets/nft/charge-supercharger.png';
import chargeKilovolt from '@/assets/nft/charge-megavolt.png';
import chargeAmpforge from '@/assets/nft/charge-amperage.png';
import chargeChargepoint from '@/assets/nft/charge-destination.png';
import chargeGigacharge from '@/assets/nft/charge-gigawatt.png';
import chargeMegacharge from '@/assets/nft/charge-megawatt.png';
import chargeTeracharge from '@/assets/nft/charge-terawatt.png';

// EV Miles NFTs (10 tiers)
import evSparkstart from '@/assets/nft/ev-ignition.png';
import evVelocity from '@/assets/nft/ev-cruiser.png';
import evAutobahn from '@/assets/nft/ev-autobahn.png';
import evHyperdrive from '@/assets/nft/ev-hyperlane.png';
import evElectra from '@/assets/nft/ev-roadster.png';
import evVelocityPro from '@/assets/nft/ev-plaid.png';
import evMachOne from '@/assets/nft/ev-ludicrous.png';
import evCentauri from '@/assets/nft/ev-centurion.png';
import evVoyager from '@/assets/nft/ev-voyager.png';
import evOdyssey from '@/assets/nft/ev-legend.png';

// Combo NFTs (8 tiers)
import comboDualPioneer from '@/assets/nft/combo-duality.png';
import comboTripleTrailblazer from '@/assets/nft/combo-trifecta.png';
import comboQuintessence from '@/assets/nft/combo-quadrant.png';
import comboDecaDriver from '@/assets/nft/combo-constellation.png';
import comboVigorVanguard from '@/assets/nft/combo-ecosystem.png';
import comboZenithAchiever from '@/assets/nft/combo-sovereign.png';
import comboApexMaster from '@/assets/nft/combo-master.png';
import comboTotalEclipse from '@/assets/nft/combo-apex.png';

// Map milestone IDs to their artwork
export const NFT_ARTWORK: Record<string, string> = {
  // Welcome
  welcome: welcomeNft,
  
  // Solar (8 tiers)
  solar_1: solarSunspark,
  solar_2: solarPhotonic,
  solar_3: solarRayforge,
  solar_4: solarSolaris,
  solar_5: solarHelios,
  solar_6: solarSunforge,
  solar_7: solarGigasun,
  solar_8: solarStarforge,
  
  // Battery (7 tiers)
  battery_1: batteryVoltbank,
  battery_2: batteryGridpulse,
  battery_3: batteryMegacell,
  battery_4: batteryReservex,
  battery_5: batteryDynamax,
  battery_6: batteryUltracell,
  battery_7: batteryGigavolt,
  
  // EV Charging (8 tiers)
  charge_1: chargeIgnite,
  charge_2: chargeVoltcharge,
  charge_3: chargeKilovolt,
  charge_4: chargeAmpforge,
  charge_5: chargeChargepoint,
  charge_6: chargeGigacharge,
  charge_7: chargeMegacharge,
  charge_8: chargeTeracharge,
  
  // EV Miles (10 tiers)
  ev_1: evSparkstart,
  ev_2: evVelocity,
  ev_3: evAutobahn,
  ev_4: evHyperdrive,
  ev_5: evElectra,
  ev_6: evVelocityPro,
  ev_7: evMachOne,
  ev_8: evCentauri,
  ev_9: evVoyager,
  ev_10: evOdyssey,
  
  // Combos (8 tiers)
  combo_1: comboDualPioneer,
  combo_2: comboTripleTrailblazer,
  combo_3: comboQuintessence,
  combo_4: comboDecaDriver,
  combo_5: comboVigorVanguard,
  combo_6: comboZenithAchiever,
  combo_7: comboApexMaster,
  combo_8: comboTotalEclipse,
};

// Get artwork for a milestone ID
export function getNftArtwork(milestoneId: string): string | null {
  return NFT_ARTWORK[milestoneId] || null;
}
