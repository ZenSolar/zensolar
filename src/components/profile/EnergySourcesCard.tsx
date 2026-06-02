/**
 * EnergySourcesCard — preferred name for the SSOT control surface where
 * users view & edit their primary solar source (installer + inverter brand).
 *
 * Re-exports `InstallerCard` to avoid breaking existing imports while we
 * standardize on the "Energy Sources" terminology in product copy.
 */
export { InstallerCard as EnergySourcesCard } from "./InstallerCard";
