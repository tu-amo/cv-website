-- Migration: Add unit_system preference to user profiles
-- Date: 2026-04-17
--
-- Gives every user a preferred measurement system that the AI scan
-- will use when outputting ingredient quantities, and the wizard will
-- show when surfacing the unit conversion option in Step 4.
--
-- Supported values:
--   metric       = grams, millilitres, °C  (default — global standard)
--   uk_imperial  = oz/lb, UK fluid ounces, UK pint (568ml), UK tablespoon
--   us_imperial  = US cups, US fluid oz, US pint (473ml), Fahrenheit

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS unit_system TEXT NOT NULL DEFAULT 'metric'
  CHECK (unit_system IN ('metric', 'uk_imperial', 'us_imperial'));

COMMENT ON COLUMN profiles.unit_system IS
  'Preferred measurement system for AI scan output and recipe display.
   metric       = g, ml, °C
   uk_imperial  = oz, lb, UK fl oz, UK pint (568ml), °C
   us_imperial  = cups, US fl oz, US pint (473ml), °F';
