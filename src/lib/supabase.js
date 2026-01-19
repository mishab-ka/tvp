import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User management functions
export const userManagementAPI = {
  // Get users with pagination and filters
  async getUsers(page = 1, limit = 10, filters = {}) {
    try {
      let query = supabase.from("users").select(
        `
          *,
          user_profiles!user_id (
            id,
            full_name,
            phone,
            department,
            avatar_url,
            bio
          ),
          user_roles!role_id (
            id,
            role_name,
            display_name,
            permissions
          )
        `,
        { count: "exact" }
      );

      // Apply filters
      if (filters.search) {
        query = query.or(
          `email.ilike.%${filters.search}%,user_profiles.full_name.ilike.%${filters.search}%`
        );
      }
      if (filters.role) {
        query = query.eq("user_roles.role_name", filters.role);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.department) {
        query = query.eq("user_profiles.department", filters.department);
      }
      if (filters.ssoEnabled) {
        query = query.eq("sso_enabled", true);
      }
      if (filters.mfaEnabled) {
        query = query.eq("mfa_enabled", true);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        // If table doesn't exist, return empty result
        if (
          error.code === "PGRST116" ||
          error.message.includes("relation") ||
          error.message.includes("does not exist")
        ) {
          return { users: [], total: 0 };
        }
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      return { users: data || [], total: count || 0 };
    } catch (error) {
      console.error("Error in getUsers:", error);
      return { users: [], total: 0 };
    }
  },

  // Get user by ID
  async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          *,
          user_profiles!user_id (
            id,
            full_name,
            phone,
            department,
            avatar_url,
            bio,
            created_at,
            updated_at
          ),
          user_roles!role_id (
            id,
            role_name,
            display_name,
            permissions
          ),
          user_sessions!user_id (
            id,
            session_token,
            created_at,
            last_activity,
            expires_at,
            is_active
          )
        `
        )
        .eq("id", userId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch user: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Error in getUserById:", error);
      throw error;
    }
  },

  // Create new user with password hashing
  async createUser(userData) {
    try {
      // Generate a unique ID for the user
      const userId = crypto.randomUUID();

      // Get the default role if no role is specified
      let roleId = userData.roleId;
      if (!roleId) {
        const { data: defaultRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("role_name", "user")
          .single();

        if (defaultRole) {
          roleId = defaultRole.id;
        }
      }

      // Hash the password if provided
      let passwordHash = null;
      if (userData.password) {
        const { data: hashResult, error: hashError } = await supabase.rpc(
          "generate_password_hash",
          {
            password: userData.password,
          }
        );

        if (hashError) {
          throw new Error(`Failed to hash password: ${hashError.message}`);
        }
        passwordHash = hashResult;
      }

      // Create the user in our custom tables
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            id: userId,
            email: userData.email,
            status: userData.status || "active",
            sso_enabled: userData.ssoEnabled || false,
            mfa_enabled: userData.mfaEnabled || false,
            role_id: roleId,
            password_hash: passwordHash,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.message.includes("foreign key constraint")) {
          throw new Error(`Invalid role selected. Please choose a valid role.`);
        }
        if (error.message.includes("duplicate key")) {
          throw new Error(`User with this email already exists.`);
        }
        throw new Error(`Failed to create user: ${error.message}`);
      }

      // Create user profile
      if (userData.profile) {
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert([
            {
              user_id: userId,
              full_name: userData.profile.fullName,
              phone: userData.profile.phone,
              department: userData.profile.department,
              avatar_url: userData.profile.avatarUrl,
              bio: userData.profile.bio,
            },
          ]);

        if (profileError) {
          console.warn("Failed to create user profile:", profileError);
          // Don't throw error here as the user was created successfully
        }
      }

      // Return the created user data
      return {
        ...data,
        auth_user: { id: userId, email: userData.email },
      };
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  },

  // Update user
  async updateUser(userId, userData) {
    try {
      console.log("Updating user:", userId, "with data:", userData); // Debug log

      // Update user table
      const { data, error } = await supabase
        .from("users")
        .update({
          email: userData.email,
          status: userData.status,
          sso_enabled: userData.ssoEnabled,
          mfa_enabled: userData.mfaEnabled,
          role_id: userData.roleId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update user: ${error.message}`);
      }

      console.log("User table updated successfully:", data); // Debug log

      // Update user profile if profile data is provided
      if (userData.profile) {
        console.log("Updating profile with data:", userData.profile); // Debug log

        // First, check if profile exists (use a simpler approach)
        const { data: existingProfiles, error: checkError } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("user_id", userId);

        if (checkError) {
          console.error("Error checking profile existence:", checkError);
          // Continue with insert anyway
        }

        const existingProfile =
          existingProfiles && existingProfiles.length > 0
            ? existingProfiles[0]
            : null;

        if (existingProfile) {
          // Update existing profile
          const { error: profileError } = await supabase
            .from("user_profiles")
            .update({
              full_name: userData.profile.fullName,
              phone: userData.profile.phone,
              department: userData.profile.department,
              avatar_url: userData.profile.avatarUrl,
              bio: userData.profile.bio,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (profileError) {
            console.error("Failed to update user profile:", profileError);
            throw new Error(
              `Failed to update user profile: ${profileError.message}`
            );
          }
        } else {
          // Create new profile
          const { error: profileError } = await supabase
            .from("user_profiles")
            .insert([
              {
                user_id: userId,
                full_name: userData.profile.fullName,
                phone: userData.profile.phone,
                department: userData.profile.department,
                avatar_url: userData.profile.avatarUrl,
                bio: userData.profile.bio,
              },
            ]);

          if (profileError) {
            console.error("Failed to create user profile:", profileError);
            throw new Error(
              `Failed to create user profile: ${profileError.message}`
            );
          }
        }

        console.log("Profile updated successfully"); // Debug log
      }

      return data;
    } catch (error) {
      console.error("Error in updateUser:", error);
      throw error;
    }
  },

  // Delete user
  async deleteUser(userId) {
    try {
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) {
        throw new Error(`Failed to delete user: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error("Error in deleteUser:", error);
      throw error;
    }
  },

  // Bulk update users
  async bulkUpdateUsers(userIds, updates) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .in("id", userIds)
        .select();

      if (error) {
        throw new Error(`Failed to bulk update users: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Error in bulkUpdateUsers:", error);
      throw error;
    }
  },

  // Reset user password
  async resetUserPassword(userId) {
    try {
      const { error } = await supabase.auth.admin.resetPasswordForEmail(
        userId,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        throw new Error(`Failed to reset password: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error("Error in resetUserPassword:", error);
      throw error;
    }
  },

  // Get user statistics
  async getUserStats() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("status, sso_enabled, mfa_enabled");

      if (error) {
        // If table doesn't exist, return default stats
        if (
          error.code === "PGRST116" ||
          error.message.includes("relation") ||
          error.message.includes("does not exist")
        ) {
          return {
            total: 0,
            active: 0,
            ssoEnabled: 0,
            mfaEnabled: 0,
          };
        }
        throw new Error(`Failed to fetch user stats: ${error.message}`);
      }

      const stats = {
        total: data.length,
        active: data.filter((user) => user.status === "active").length,
        ssoEnabled: data.filter((user) => user.sso_enabled).length,
        mfaEnabled: data.filter((user) => user.mfa_enabled).length,
      };

      return stats;
    } catch (error) {
      console.error("Error in getUserStats:", error);
      return {
        total: 0,
        active: 0,
        ssoEnabled: 0,
        mfaEnabled: 0,
      };
    }
  },

  // Get roles
  async getRoles() {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("role_name");

      if (error) {
        // If table doesn't exist, return default roles
        if (
          error.code === "PGRST116" ||
          error.message.includes("relation") ||
          error.message.includes("does not exist")
        ) {
          return [
            {
              id: "1",
              role_name: "super_admin",
              display_name: "Super Administrator",
            },
            { id: "2", role_name: "admin", display_name: "Administrator" },
            { id: "3", role_name: "manager", display_name: "Manager" },
            { id: "4", role_name: "user", display_name: "User" },
          ];
        }
        throw new Error(`Failed to fetch roles: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Error in getRoles:", error);
      return [
        {
          id: "1",
          role_name: "super_admin",
          display_name: "Super Administrator",
        },
        { id: "2", role_name: "admin", display_name: "Administrator" },
        { id: "3", role_name: "manager", display_name: "Manager" },
        { id: "4", role_name: "user", display_name: "User" },
      ];
    }
  },

  // Get departments
  async getDepartments() {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("department")
        .not("department", "is", null);

      if (error) {
        // If table doesn't exist, return default departments
        if (
          error.code === "PGRST116" ||
          error.message.includes("relation") ||
          error.message.includes("does not exist")
        ) {
          return ["operations", "finance", "it", "hr"];
        }
        throw new Error(`Failed to fetch departments: ${error.message}`);
      }

      const departments = [...new Set(data.map((item) => item.department))];
      return departments;
    } catch (error) {
      console.error("Error in getDepartments:", error);
      return ["operations", "finance", "it", "hr"];
    }
  },

  // Authenticate user by email or phone
  async authenticateUser(identifier, password, authMethod = "email") {
    try {
      console.log("Authenticating user:", identifier, "Method:", authMethod); // Debug log

      let query = supabase.from("users").select(
        `
          *,
          user_profiles!user_id (
            id,
            full_name,
            phone,
            department,
            avatar_url,
            bio
          ),
          user_roles!role_id (
            id,
            role_name,
            display_name,
            permissions
          )
        `
      );

      // Build query based on authentication method
      if (authMethod === "email") {
        query = query.eq("email", identifier);
      } else {
        // For phone authentication, we need to join with user_profiles
        query = query.eq("user_profiles.phone", identifier);
      }

      query = query.eq("status", "active");

      const { data: users, error: userError } = await query;

      if (userError || !users || users.length === 0) {
        console.log("User not found or inactive:", userError); // Debug log
        return null;
      }

      const user = users[0]; // Get the first matching user

      // Handle profile and role data
      const profile = Array.isArray(user.user_profiles)
        ? user.user_profiles[0]
        : user.user_profiles;

      const role = Array.isArray(user.user_roles)
        ? user.user_roles[0]
        : user.user_roles;

      console.log("Found user:", user.id, "Role:", role?.role_name); // Debug log

      // Verify password using database hash
      if (!user.password_hash) {
        console.log("No password hash found for user:", identifier);
        console.log("This user may have been created via SSO or without a password. Please set a password in the database.");
        return null;
      }

      // Generate hash for the provided password
      const { data: hashResult, error: hashError } = await supabase.rpc(
        "generate_password_hash",
        {
          password: password,
        }
      );

      if (hashError) {
        console.error("Error generating password hash:", hashError);
        return null;
      }

      // Compare the generated hash with stored hash
      if (hashResult !== user.password_hash) {
        console.log("Invalid password for user:", identifier);
        return null;
      }

      // Update last login time
      await this.updateLastLogin(user.id);

      // Return user data with profile and role information
      return {
        id: user.id,
        email: user.email,
        phone: profile?.phone || "",
        name: profile?.full_name || user.email,
        role: role?.role_name || "user",
        roleId: user.role_id,
        status: user.status,
        department: profile?.department || "",
        permissions: role?.permissions || [],
        avatarUrl: profile?.avatar_url || "",
        bio: profile?.bio || "",
        ssoEnabled: user.sso_enabled || false,
        mfaEnabled: user.mfa_enabled || false,
        lastLogin: user.last_sign_in_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };
    } catch (error) {
      console.error("Error in authenticateUser:", error);
      return null;
    }
  },

  // Update last login time
  async updateLastLogin(userId) {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          last_sign_in_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Failed to update last login:", error);
      } else {
        console.log("Last login updated for user:", userId); // Debug log
      }
    } catch (error) {
      console.error("Error updating last login:", error);
    }
  },

  // Check user permissions
  async checkUserPermissions(userId, requiredPermissions) {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select(
          `
          user_roles!role_id (
            permissions
          )
        `
        )
        .eq("id", userId)
        .single();

      if (error || !user) {
        return false;
      }

      const role = Array.isArray(user.user_roles)
        ? user.user_roles[0]
        : user.user_roles;

      const userPermissions = role?.permissions || [];

      // Check if user has all required permissions
      return requiredPermissions.every((permission) =>
        userPermissions.includes(permission)
      );
    } catch (error) {
      console.error("Error checking permissions:", error);
      return false;
    }
  },
};
