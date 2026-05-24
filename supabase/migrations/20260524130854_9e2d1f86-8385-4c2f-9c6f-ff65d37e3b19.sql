
-- Pillar 4: Anti-Double-Count via fingerprints + unique indexes.
-- Fingerprints are populated by BEFORE INSERT/UPDATE triggers (extract(epoch)
-- on timestamptz is the only immutable time projection we get, so we use it
-- instead of generated columns).

-- ===== shared helper =====
CREATE OR REPLACE FUNCTION public.compute_event_fingerprint_energy_production()
RETURNS trigger LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  NEW.event_fingerprint := md5(
    coalesce(NEW.provider,'') || '|' ||
    coalesce(NEW.device_id,'') || '|' ||
    coalesce(NEW.data_type,'') || '|' ||
    coalesce(extract(epoch from NEW.recorded_at)::text, '')
  );
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.compute_event_fingerprint_charging_sessions()
RETURNS trigger LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  NEW.event_fingerprint := md5(
    coalesce(NEW.provider,'') || '|' ||
    coalesce(NEW.device_id,'') || '|' ||
    coalesce(NEW.charging_type,'') || '|' ||
    coalesce(NEW.session_date::text,'') || '|' ||
    coalesce(round(NEW.energy_kwh::numeric, 2)::text, '0')
  );
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.compute_event_fingerprint_home_charging()
RETURNS trigger LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  NEW.event_fingerprint := md5(
    coalesce(NEW.device_id,'') || '|' ||
    coalesce(extract(epoch from NEW.start_time)::text, '')
  );
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.compute_event_fingerprint_bidir()
RETURNS trigger LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  NEW.event_fingerprint := md5(
    coalesce(NEW.session_id::text,'') || '|' ||
    coalesce(NEW.direction,'') || '|' ||
    coalesce(NEW.flow_type,'')
  );
  RETURN NEW;
END $$;

-- ===== energy_production =====
ALTER TABLE public.energy_production
  ADD COLUMN IF NOT EXISTS event_fingerprint text;

DROP TRIGGER IF EXISTS trg_energy_production_fingerprint ON public.energy_production;
CREATE TRIGGER trg_energy_production_fingerprint
  BEFORE INSERT OR UPDATE ON public.energy_production
  FOR EACH ROW EXECUTE FUNCTION public.compute_event_fingerprint_energy_production();

UPDATE public.energy_production SET event_fingerprint = md5(
  coalesce(provider,'') || '|' || coalesce(device_id,'') || '|' ||
  coalesce(data_type,'') || '|' || coalesce(extract(epoch from recorded_at)::text, '')
) WHERE event_fingerprint IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS energy_production_user_fingerprint_uniq
  ON public.energy_production (user_id, event_fingerprint);

-- ===== charging_sessions =====
ALTER TABLE public.charging_sessions
  ADD COLUMN IF NOT EXISTS event_fingerprint text;

DROP TRIGGER IF EXISTS trg_charging_sessions_fingerprint ON public.charging_sessions;
CREATE TRIGGER trg_charging_sessions_fingerprint
  BEFORE INSERT OR UPDATE ON public.charging_sessions
  FOR EACH ROW EXECUTE FUNCTION public.compute_event_fingerprint_charging_sessions();

UPDATE public.charging_sessions SET event_fingerprint = md5(
  coalesce(provider,'') || '|' || coalesce(device_id,'') || '|' ||
  coalesce(charging_type,'') || '|' || coalesce(session_date::text,'') || '|' ||
  coalesce(round(energy_kwh::numeric, 2)::text, '0')
) WHERE event_fingerprint IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS charging_sessions_user_fingerprint_uniq
  ON public.charging_sessions (user_id, event_fingerprint);

-- ===== home_charging_sessions =====
ALTER TABLE public.home_charging_sessions
  ADD COLUMN IF NOT EXISTS event_fingerprint text;

DROP TRIGGER IF EXISTS trg_home_charging_fingerprint ON public.home_charging_sessions;
CREATE TRIGGER trg_home_charging_fingerprint
  BEFORE INSERT OR UPDATE ON public.home_charging_sessions
  FOR EACH ROW EXECUTE FUNCTION public.compute_event_fingerprint_home_charging();

UPDATE public.home_charging_sessions SET event_fingerprint = md5(
  coalesce(device_id,'') || '|' || coalesce(extract(epoch from start_time)::text, '')
) WHERE event_fingerprint IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS home_charging_sessions_user_fingerprint_uniq
  ON public.home_charging_sessions (user_id, event_fingerprint);

-- ===== bidirectional_mint_events =====
ALTER TABLE public.bidirectional_mint_events
  ADD COLUMN IF NOT EXISTS event_fingerprint text;

DROP TRIGGER IF EXISTS trg_bidir_mint_fingerprint ON public.bidirectional_mint_events;
CREATE TRIGGER trg_bidir_mint_fingerprint
  BEFORE INSERT OR UPDATE ON public.bidirectional_mint_events
  FOR EACH ROW EXECUTE FUNCTION public.compute_event_fingerprint_bidir();

UPDATE public.bidirectional_mint_events SET event_fingerprint = md5(
  coalesce(session_id::text,'') || '|' || coalesce(direction,'') || '|' || coalesce(flow_type,'')
) WHERE event_fingerprint IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bidir_mint_events_user_fingerprint_uniq
  ON public.bidirectional_mint_events (user_id, event_fingerprint);

-- ===== connected_devices: one wallet per physical device =====
CREATE UNIQUE INDEX IF NOT EXISTS connected_devices_provider_device_uniq
  ON public.connected_devices (provider, device_id);
