# NFT Image Mapping Reference

This document maps NFT milestone names to their corresponding image files for IPFS upload.

## Directory Structure for IPFS Upload

```
zensolar-nft/
├── welcome.png                    # Welcome NFT (use zen-logo or create)
├── solar/
│   ├── sunspark.png              → solar-genesis.png
│   ├── photonic.png              → solar-photon.png
│   ├── rayforge.png              → solar-rayfield.png
│   ├── solaris.png               → solar-solarflare.png
│   ├── helios.png                → solar-heliogen.png
│   ├── sunforge.png              → solar-sunvault.png
│   ├── gigasun.png               → solar-gigasol.png
│   └── starforge.png             → solar-starpower.png
├── battery/
│   ├── voltbank.png              → battery-powerwall.png
│   ├── gridpulse.png             → battery-gridlink.png
│   ├── megacell.png              → battery-megapack.png
│   ├── reservex.png              → battery-reservoir.png
│   ├── dynamax.png               → battery-dynamo.png
│   ├── ultracell.png             → battery-ultrabank.png
│   └── gigavolt.png              → battery-gigabank.png
├── charging/
│   ├── ignite.png                → charge-spark.png
│   ├── voltcharge.png            → charge-destination.png
│   ├── kilovolt.png              → charge-megavolt.png
│   ├── ampforge.png              → charge-amperage.png
│   ├── chargeon.png              → charge-supercharger.png
│   ├── gigacharge.png            → charge-gigawatt.png
│   ├── megacharge.png            → charge-megawatt.png
│   └── teracharge.png            → charge-terawatt.png
├── ev/
│   ├── ignitor.png               → ev-ignition.png
│   ├── velocity.png              → ev-cruiser.png
│   ├── autobahn.png              → ev-autobahn.png
│   ├── hyperdrive.png            → ev-hyperlane.png
│   ├── electra.png               → ev-plaid.png
│   ├── velocity-pro.png          → ev-ludicrous.png
│   ├── mach-one.png              → ev-roadster.png
│   ├── centaurion.png            → ev-centurion.png
│   ├── voyager.png               → ev-voyager.png
│   └── odyssey.png               → ev-legend.png
└── combo/
    ├── duality.png               → combo-duality.png
    ├── trifecta.png              → combo-trifecta.png
    ├── quadrant.png              → combo-quadrant.png
    ├── constellation.png         → combo-constellation.png
    ├── cyber-echo.png            → combo-ecosystem.png
    ├── zenith.png                → combo-zenith.png
    ├── zenmaster.png             → combo-master.png
    └── total-eclipse.png         → combo-apex.png
```

## Source Files Location

All source images are in: `src/assets/nft/`

## Renaming Commands (Mac/Linux)

Run these from the project root to create the properly named copies:

```bash
# Create directories
mkdir -p public/nft-images/{solar,battery,charging,ev,combo}

# Welcome
cp src/assets/zen-logo-full-new.jpeg public/nft-images/welcome.png

# Solar
cp src/assets/nft/solar-genesis.png public/nft-images/solar/sunspark.png
cp src/assets/nft/solar-photon.png public/nft-images/solar/photonic.png
cp src/assets/nft/solar-rayfield.png public/nft-images/solar/rayforge.png
cp src/assets/nft/solar-solarflare.png public/nft-images/solar/solaris.png
cp src/assets/nft/solar-heliogen.png public/nft-images/solar/helios.png
cp src/assets/nft/solar-sunvault.png public/nft-images/solar/sunforge.png
cp src/assets/nft/solar-gigasol.png public/nft-images/solar/gigasun.png
cp src/assets/nft/solar-starpower.png public/nft-images/solar/starforge.png

# Battery
cp src/assets/nft/battery-powerwall.png public/nft-images/battery/voltbank.png
cp src/assets/nft/battery-gridlink.png public/nft-images/battery/gridpulse.png
cp src/assets/nft/battery-megapack.png public/nft-images/battery/megacell.png
cp src/assets/nft/battery-reservoir.png public/nft-images/battery/reservex.png
cp src/assets/nft/battery-dynamo.png public/nft-images/battery/dynamax.png
cp src/assets/nft/battery-ultrabank.png public/nft-images/battery/ultracell.png
cp src/assets/nft/battery-gigabank.png public/nft-images/battery/gigavolt.png

# Charging
cp src/assets/nft/charge-spark.png public/nft-images/charging/ignite.png
cp src/assets/nft/charge-destination.png public/nft-images/charging/voltcharge.png
cp src/assets/nft/charge-megavolt.png public/nft-images/charging/kilovolt.png
cp src/assets/nft/charge-amperage.png public/nft-images/charging/ampforge.png
cp src/assets/nft/charge-supercharger.png public/nft-images/charging/chargeon.png
cp src/assets/nft/charge-gigawatt.png public/nft-images/charging/gigacharge.png
cp src/assets/nft/charge-megawatt.png public/nft-images/charging/megacharge.png
cp src/assets/nft/charge-terawatt.png public/nft-images/charging/teracharge.png

# EV
cp src/assets/nft/ev-ignition.png public/nft-images/ev/ignitor.png
cp src/assets/nft/ev-cruiser.png public/nft-images/ev/velocity.png
cp src/assets/nft/ev-autobahn.png public/nft-images/ev/autobahn.png
cp src/assets/nft/ev-hyperlane.png public/nft-images/ev/hyperdrive.png
cp src/assets/nft/ev-plaid.png public/nft-images/ev/electra.png
cp src/assets/nft/ev-ludicrous.png public/nft-images/ev/velocity-pro.png
cp src/assets/nft/ev-roadster.png public/nft-images/ev/mach-one.png
cp src/assets/nft/ev-centurion.png public/nft-images/ev/centaurion.png
cp src/assets/nft/ev-voyager.png public/nft-images/ev/voyager.png
cp src/assets/nft/ev-legend.png public/nft-images/ev/odyssey.png

# Combo
cp src/assets/nft/combo-duality.png public/nft-images/combo/duality.png
cp src/assets/nft/combo-trifecta.png public/nft-images/combo/trifecta.png
cp src/assets/nft/combo-quadrant.png public/nft-images/combo/quadrant.png
cp src/assets/nft/combo-constellation.png public/nft-images/combo/constellation.png
cp src/assets/nft/combo-ecosystem.png public/nft-images/combo/cyber-echo.png
cp src/assets/nft/combo-zenith.png public/nft-images/combo/zenith.png
cp src/assets/nft/combo-master.png public/nft-images/combo/zenmaster.png
cp src/assets/nft/combo-apex.png public/nft-images/combo/total-eclipse.png
```

## After IPFS Upload

Once uploaded to Pinata/IPFS, update all metadata JSON files:

1. Get your CID from Pinata (e.g., `QmABC123...`)
2. Replace `REPLACE_WITH_CID` in all JSON files with your CID
3. Upload the metadata folder
4. Use the metadata folder CID as your `baseURI` in ZenSolarNFT contract

Example baseURI: `ipfs://QmMetadataCID123/`
