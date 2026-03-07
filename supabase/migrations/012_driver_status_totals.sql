-- Driver status: leave, resigning, going_to_24hr; NULL = just_offline
-- Add nullable driver_status and a view for the four totals

ALTER TABLE tvp_drivers
ADD COLUMN IF NOT EXISTS driver_status TEXT;

ALTER TABLE tvp_drivers
DROP CONSTRAINT IF EXISTS tvp_drivers_driver_status_check;

ALTER TABLE tvp_drivers
ADD CONSTRAINT tvp_drivers_driver_status_check
CHECK (
  driver_status IS NULL
  OR (driver_status)::text = ANY (
    ARRAY[
      'leave'::text,
      'resigning'::text,
      'going_to_24hr'::text
    ]
  )
);

COMMENT ON COLUMN tvp_drivers.driver_status IS 'leave, resigning, going_to_24hr; NULL = just_offline';

CREATE INDEX IF NOT EXISTS idx_tvp_drivers_driver_status ON tvp_drivers(driver_status);

-- One row: total_resigning, total_leave, total_going_to_24hr, total_just_offline
CREATE OR REPLACE VIEW tvp_driver_status_totals AS
SELECT
  COUNT(*) FILTER (WHERE (driver_status)::text = 'resigning') AS total_resigning,
  COUNT(*) FILTER (WHERE (driver_status)::text = 'leave')     AS total_leave,
  COUNT(*) FILTER (WHERE (driver_status)::text = 'going_to_24hr') AS total_going_to_24hr,
  COUNT(*) FILTER (WHERE driver_status IS NULL)               AS total_just_offline
FROM tvp_drivers;

COMMENT ON VIEW tvp_driver_status_totals IS 'Counts of drivers by driver_status: resigning, leave, going_to_24hr; null counts as just_offline';
