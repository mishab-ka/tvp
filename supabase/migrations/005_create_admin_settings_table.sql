-- Create admin_settings table for storing dynamic configuration
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_type VARCHAR(50) NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE(setting_type, setting_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_settings_type ON admin_settings(setting_type);
CREATE INDEX IF NOT EXISTS idx_admin_settings_type_key ON admin_settings(setting_type, setting_key);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default fleet rent slabs
INSERT INTO admin_settings (setting_type, setting_key, setting_value, description) VALUES
('fleet_expense', 'rent_slabs', '[
  {"min_trips": 0, "max_trips": 63, "amount": 980},
  {"min_trips": 64, "max_trips": 79, "amount": 830},
  {"min_trips": 80, "max_trips": 109, "amount": 740},
  {"min_trips": 110, "max_trips": 124, "amount": 560},
  {"min_trips": 125, "max_trips": 139, "amount": 410},
  {"min_trips": 140, "max_trips": null, "amount": 290}
]'::jsonb, 'Fleet rent expense calculation based on trip count')
ON CONFLICT (setting_type, setting_key) DO NOTHING;

-- Insert default company earnings slabs (regular shift)
INSERT INTO admin_settings (setting_type, setting_key, setting_value, description) VALUES
('company_earnings', 'earnings_slabs', '[
  {"min_trips": 0, "max_trips": 4, "amount": 795},
  {"min_trips": 5, "max_trips": 7, "amount": 745},
  {"min_trips": 8, "max_trips": 9, "amount": 715},
  {"min_trips": 10, "max_trips": 10, "amount": 635},
  {"min_trips": 11, "max_trips": 11, "amount": 585},
  {"min_trips": 12, "max_trips": null, "amount": 535}
]'::jsonb, 'Company earnings calculation based on trip count for regular shifts')
ON CONFLICT (setting_type, setting_key) DO NOTHING;

-- Insert default company earnings slabs (24-hour shift)
INSERT INTO admin_settings (setting_type, setting_key, setting_value, description) VALUES
('company_earnings', 'earnings_slabs_24hr', '[
  {"min_trips": 0, "max_trips": 9, "amount": 1590},
  {"min_trips": 10, "max_trips": 15, "amount": 1490},
  {"min_trips": 16, "max_trips": 19, "amount": 1430},
  {"min_trips": 20, "max_trips": 21, "amount": 1270},
  {"min_trips": 22, "max_trips": 23, "amount": 1170},
  {"min_trips": 24, "max_trips": null, "amount": 1070}
]'::jsonb, 'Company earnings calculation for 24-hour shifts')
ON CONFLICT (setting_type, setting_key) DO NOTHING;

-- Insert default vehicle performance rental income
INSERT INTO admin_settings (setting_type, setting_key, setting_value, description) VALUES
('company_earnings', 'vehicle_performance_rental_income', '0'::jsonb, 'Fixed rental income amount for Vehicle Performance tab')
ON CONFLICT (setting_type, setting_key) DO NOTHING;

-- Insert default general settings
INSERT INTO admin_settings (setting_type, setting_key, setting_value, description) VALUES
('general', 'company_info', '{
  "company_name": "Tawaaq Fleet LLP",
  "contact_email": "admin@tawaaq.com",
  "contact_phone": "+91 9606393089"
}'::jsonb, 'General company information')
ON CONFLICT (setting_type, setting_key) DO NOTHING;

-- Insert default notification preferences
INSERT INTO admin_settings (setting_type, setting_key, setting_value, description) VALUES
('notifications', 'preferences', '{
  "email_notifications": true,
  "sms_notifications": false,
  "new_report_notifications": true
}'::jsonb, 'Notification preferences')
ON CONFLICT (setting_type, setting_key) DO NOTHING;

-- Insert default system config
INSERT INTO admin_settings (setting_type, setting_key, setting_value, description) VALUES
('system', 'config', '{
  "dark_mode": false,
  "debug_mode": false,
  "maintenance_mode": false,
  "api_key": ""
}'::jsonb, 'System configuration settings')
ON CONFLICT (setting_type, setting_key) DO NOTHING;

-- Insert default penalty division settings
INSERT INTO admin_settings (setting_type, setting_key, setting_value, description) VALUES
('penalty_division', 'division_period', '{
  "division_days": 7,
  "enabled": true,
  "auto_apply": true
}'::jsonb, 'Penalty division period in days and settings')
ON CONFLICT (setting_type, setting_key) DO NOTHING;



