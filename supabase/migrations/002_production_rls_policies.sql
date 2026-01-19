-- Production RLS Policies
-- Only run this migration when you're ready for production
-- This provides proper security without recursion issues

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

-- User roles policies (simple read access for authenticated users)
CREATE POLICY "Allow read access to user roles" ON user_roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Allow admins to manage all profiles (simplified check)
CREATE POLICY "Admins can manage all profiles" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role_id IN (
        SELECT id FROM user_roles WHERE role_name IN ('super_admin', 'admin')
      )
    )
  );

-- User sessions policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

-- Allow admins to manage all sessions (simplified check)
CREATE POLICY "Admins can manage all sessions" ON user_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role_id IN (
        SELECT id FROM user_roles WHERE role_name IN ('super_admin', 'admin')
      )
    )
  );

-- Users table policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (id = auth.uid());

-- Allow admins to manage all users (simplified check)
CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role_id IN (
        SELECT id FROM user_roles WHERE role_name IN ('super_admin', 'admin')
      )
    )
  );

-- Saved filters policies
CREATE POLICY "Users can manage their own filters" ON saved_filters
  FOR ALL USING (user_id = auth.uid());
