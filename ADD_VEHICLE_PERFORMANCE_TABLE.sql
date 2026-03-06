-- Create tvp_vehicle_performance table for Vehicle Performance Sheet
-- Stores editable per-vehicle per-week data: vehicle_level_adjustment, fleet_trips

CREATE TABLE IF NOT EXISTS tvp_vehicle_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  vehicle_level_adjustment NUMERIC(12, 2) DEFAULT 0,
  fleet_trips INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vehicle_number, week_start)
);

-- Index for week-based queries
CREATE INDEX IF NOT EXISTS idx_tvp_vehicle_performance_week ON tvp_vehicle_performance(week_start, week_end);

-- Index for vehicle lookups
CREATE INDEX IF NOT EXISTS idx_tvp_vehicle_performance_vehicle ON tvp_vehicle_performance(vehicle_number);

-- Trigger for updated_at (reuse set_updated_at if exists)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tvp_vehicle_performance_updated_at ON tvp_vehicle_performance;
CREATE TRIGGER trg_tvp_vehicle_performance_updated_at
  BEFORE UPDATE ON tvp_vehicle_performance
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE tvp_vehicle_performance IS 'Per-vehicle per-week editable fields for Vehicle Performance Sheet (adjustment, fleet trips)';
