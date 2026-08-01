COMMENT ON FUNCTION public.get_solar_duplicate_registration_signals(integer) IS
'REPORT ONLY, PERMANENTLY. This detector never demotes, excludes, or blocks a device, and must never be wired into the mint path or into resolveExclusions().

Why: two solar arrays on one account that produce a near-identical ratio with low variance are a REAL and legitimate configuration. Patores 5.5kW and Patores 2.2kw are two distinct physical arrays at one property, both authoritative, both correctly earning. A matching production profile is evidence of similar orientation and irradiance, not evidence of a duplicate registration.

Authority is decided by measurement SCOPE only (does one meter span the other), never by location, address, coordinates, ratio, or device count. This function exists so a genuine double-registration can be reviewed by a human, and for no other purpose. A signal here is a prompt to look, never a reason to act automatically.';