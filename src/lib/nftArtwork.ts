// NFT Artwork mapping - maps milestone IDs to their generated images
// Updated: January 14, 2026 - All 41 NFTs now have artwork

// Welcome NFT
import welcomeNft from '@/assets/nft/solar-genesis.png';

// Solar NFTs (8 tiers)
import solarSunlink from '@/assets/nft/solar-sunlink.png';
import solarPhoton from '@/assets/nft/solar-photon.png';
import solarRayfield from '@/assets/nft/solar-rayfield.png';
import solarSolarflare from '@/assets/nft/solar-solarflare.png';
import solarHeliogen from '@/assets/nft/solar-heliogen.png';
import solarSunvault from '@/assets/nft/solar-sunvault.png';
import solarGigasol from '@/assets/nft/solar-gigasol.png';
import solarStarpower from '@/assets/nft/solar-starpower.png';

// Battery NFTs (7 tiers)
import batteryPowerwall from '@/assets/nft/battery-powerwall.png';
import batteryGridlink from '@/assets/nft/battery-gridlink.png';
import batteryMegapack from '@/assets/nft/battery-megapack.png';
import batteryReservoir from '@/assets/nft/battery-reservoir.png';
import batteryDynamo from '@/assets/nft/battery-dynamo.png';
import batteryGigabank from '@/assets/nft/battery-gigabank.png';
import batteryUltrabank from '@/assets/nft/battery-ultrabank.png';

// EV Charging NFTs (8 tiers)
import chargeSpark from '@/assets/nft/charge-spark.png';
import chargeSupercharger from '@/assets/nft/charge-supercharger.png';
import chargeMegavolt from '@/assets/nft/charge-megavolt.png';
import chargeAmperage from '@/assets/nft/charge-amperage.png';
import chargeDestination from '@/assets/nft/charge-destination.png';
import chargeGigawatt from '@/assets/nft/charge-gigawatt.png';
import chargeMegawatt from '@/assets/nft/charge-megawatt.png';
import chargeTerawatt from '@/assets/nft/charge-terawatt.png';

// EV Miles NFTs (10 tiers)
import evIgnition from '@/assets/nft/ev-ignition.png';
import evCruiser from '@/assets/nft/ev-cruiser.png';
import evAutobahn from '@/assets/nft/ev-autobahn.png';
import evHyperlane from '@/assets/nft/ev-hyperlane.png';
import evRoadster from '@/assets/nft/ev-roadster.png';
import evPlaid from '@/assets/nft/ev-plaid.png';
import evLudicrous from '@/assets/nft/ev-ludicrous.png';
import evCenturion from '@/assets/nft/ev-centurion.png';
import evVoyager from '@/assets/nft/ev-voyager.png';
import evLegend from '@/assets/nft/ev-legend.png';

// Combo NFTs (9 tiers)
import comboDuality from '@/assets/nft/combo-duality.png';
import comboTrifecta from '@/assets/nft/combo-trifecta.png';
import comboQuadrant from '@/assets/nft/combo-quadrant.png';
import comboConstellation from '@/assets/nft/combo-constellation.png';
import comboEcosystem from '@/assets/nft/combo-ecosystem.png';
import comboSovereign from '@/assets/nft/combo-sovereign.png';
import comboMaster from '@/assets/nft/combo-master.png';
import comboApex from '@/assets/nft/combo-apex.png';
import comboZenith from '@/assets/nft/combo-zenith.png';

// Map milestone IDs to their artwork
export const NFT_ARTWORK: Record<string, string> = {
  // Welcome
  welcome: welcomeNft,
  
  // Solar (8 tiers)
  solar_1: solarSunlink,
  solar_2: solarPhoton,
  solar_3: solarRayfield,
  solar_4: solarSolarflare,
  solar_5: solarHeliogen,
  solar_6: solarSunvault,
  solar_7: solarGigasol,
  solar_8: solarStarpower,
  
  // Battery (7 tiers)
  battery_1: batteryPowerwall,
  battery_2: batteryGridlink,
  battery_3: batteryMegapack,
  battery_4: batteryReservoir,
  battery_5: batteryDynamo,
  battery_6: batteryGigabank,
  battery_7: batteryUltrabank,
  
  // EV Charging (8 tiers)
  charge_1: chargeSpark,
  charge_2: chargeSupercharger,
  charge_3: chargeMegavolt,
  charge_4: chargeAmperage,
  charge_5: chargeDestination,
  charge_6: chargeGigawatt,
  charge_7: chargeMegawatt,
  charge_8: chargeTerawatt,
  
  // EV Miles (10 tiers)
  ev_1: evIgnition,
  ev_2: evCruiser,
  ev_3: evAutobahn,
  ev_4: evHyperlane,
  ev_5: evRoadster,
  ev_6: evPlaid,
  ev_7: evLudicrous,
  ev_8: evCenturion,
  ev_9: evVoyager,
  ev_10: evLegend,
  
  // Combos (9 tiers)
  combo_1: comboDuality,
  combo_2: comboTrifecta,
  combo_3: comboQuadrant,
  combo_4: comboConstellation,
  combo_5: comboEcosystem,
  combo_6: comboSovereign,
  combo_7: comboMaster,
  combo_8: comboApex,
  combo_9: comboZenith,
};

// Get artwork for a milestone ID
export function getNftArtwork(milestoneId: string): string | null {
  return NFT_ARTWORK[milestoneId] || null;
}
