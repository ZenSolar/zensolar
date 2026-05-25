/**
 * Curated list of common US residential solar installers.
 *
 * Used by the Profile → Installer card to pre-populate the company name
 * (and optionally phone/email/website) when a customer starts typing.
 *
 * NOT a directory — just a head-list of the most-installed brands so users
 * don't have to type every character. Anything not in this list can still be
 * entered manually via the free-text fields.
 *
 * Phone numbers are the public customer-care / sales lines and may differ by
 * region; treat them as a starting point the user can correct.
 */
export interface KnownInstaller {
  /** Display name shown in the dropdown */
  name: string;
  /** Legal/company name to pre-fill in the Company field */
  company: string;
  /** Public customer-care line, when widely published */
  phone?: string;
  /** Generic support / contact inbox */
  email?: string;
  /** Pre-filled hint for the user (e.g. "National · Tesla-certified") */
  note?: string;
}

export const KNOWN_INSTALLERS: KnownInstaller[] = [
  { name: "Tesla Energy", company: "Tesla, Inc.", phone: "1-877-961-7652", email: "energysupport@tesla.com", note: "Tesla-installed PV → use Tesla API" },
  { name: "Sunrun", company: "Sunrun Inc.", phone: "1-855-478-6786", email: "customercare@sunrun.com", note: "Largest US residential installer" },
  { name: "Sunnova", company: "Sunnova Energy", phone: "1-866-786-6682", email: "customerservice@sunnova.com" },
  { name: "SunPower", company: "SunPower Corporation", phone: "1-800-786-7693", email: "customerservice@sunpower.com" },
  { name: "Palmetto Solar", company: "Palmetto Solar, LLC", phone: "1-855-339-1831", email: "support@palmetto.com" },
  { name: "ADT Solar", company: "ADT Solar (formerly Sunpro)", phone: "1-800-374-4673" },
  { name: "Momentum Solar", company: "Momentum Solar", phone: "1-888-666-3686" },
  { name: "Trinity Solar", company: "Trinity Solar", phone: "1-800-373-1490" },
  { name: "Freedom Forever", company: "Freedom Forever LLC", phone: "1-800-685-1492" },
  { name: "Blue Raven Solar", company: "Blue Raven Solar", phone: "1-800-377-4480" },
  { name: "Pink Energy", company: "Pink Energy (formerly Power Home Solar)", phone: "1-800-859-9888" },
  { name: "Vivint Solar", company: "Vivint Solar (now Sunrun)", phone: "1-877-404-4129" },
  { name: "Tesla-certified installer", company: "Tesla-certified installer", note: "Generic — fill in the local company name" },
  { name: "Local installer", company: "", note: "Fill in name + company manually" },
];
