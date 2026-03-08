-- Add operator column to tvp_drivers (boolean: true = operator, false = driver)
ALTER TABLE tvp_drivers
ADD COLUMN IF NOT EXISTS operator BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN tvp_drivers.operator IS 'true = operator, false = driver';
