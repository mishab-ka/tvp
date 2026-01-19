// Authentication utility functions

export const authUtils = {
  // Check if user is authenticated
  isAuthenticated() {
    try {
      const session = localStorage.getItem("tawaaq_session");
      if (!session) return false;

      const sessionData = JSON.parse(session);
      return new Date(sessionData.expiresAt) > new Date();
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  },

  // Get current user data
  getCurrentUser() {
    try {
      const session = localStorage.getItem("tawaaq_session");
      if (!session) return null;

      const sessionData = JSON.parse(session);
      if (new Date(sessionData.expiresAt) <= new Date()) {
        this.logout();
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  },

  // Login user
  login(userData) {
    try {
      const sessionData = {
        ...userData,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
      };

      localStorage.setItem("tawaaq_session", JSON.stringify(sessionData));
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      return false;
    }
  },

  // Logout user
  logout() {
    try {
      localStorage.removeItem("tawaaq_session");
      return true;
    } catch (error) {
      console.error("Error during logout:", error);
      return false;
    }
  },

  // Check if user has required role
  hasRole(requiredRoles) {
    const user = this.getCurrentUser();
    if (!user) return false;

    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }

    return user.role === requiredRoles;
  },

  // Check if user has required permissions
  hasPermission(requiredPermissions) {
    const user = this.getCurrentUser();
    if (!user || !user.permissions) return false;

    if (Array.isArray(requiredPermissions)) {
      return requiredPermissions.every((permission) =>
        user.permissions.includes(permission)
      );
    }

    return user.permissions.includes(requiredPermissions);
  },

  // Extend session
  extendSession() {
    try {
      const user = this.getCurrentUser();
      if (!user) return false;

      return this.login(user);
    } catch (error) {
      console.error("Error extending session:", error);
      return false;
    }
  },

  // Get session expiry time
  getSessionExpiry() {
    try {
      const session = localStorage.getItem("tawaaq_session");
      if (!session) return null;

      const sessionData = JSON.parse(session);
      return new Date(sessionData.expiresAt);
    } catch (error) {
      console.error("Error getting session expiry:", error);
      return null;
    }
  },

  // Check if session is about to expire (within 5 minutes)
  isSessionExpiringSoon() {
    const expiry = this.getSessionExpiry();
    if (!expiry) return false;

    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return expiry <= fiveMinutesFromNow;
  },

  // Format phone number for display
  formatPhoneNumber(phone) {
    if (!phone) return "";

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "");

    // Format Saudi phone number
    if (cleaned.startsWith("966")) {
      const number = cleaned.substring(3);
      return `+966 ${number.substring(0, 2)} ${number.substring(
        2,
        5
      )} ${number.substring(5)}`;
    }

    return phone;
  },

  // Validate phone number format
  validatePhoneNumber(phone) {
    if (!phone) return false;

    const cleaned = phone.replace(/\D/g, "");

    // Check if it's a valid Saudi phone number
    if (cleaned.startsWith("966") && cleaned.length === 12) {
      return true;
    }

    // Check if it's a local Saudi number (9 digits starting with 5)
    if (cleaned.length === 9 && cleaned.startsWith("5")) {
      return true;
    }

    return false;
  },

  // Validate email format
  validateEmail(email) {
    if (!email) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Get user display name
  getUserDisplayName(user) {
    if (!user) return "Unknown User";

    if (user.name) return user.name;
    if (user.email) return user.email;
    if (user.phone) return this.formatPhoneNumber(user.phone);

    return "Unknown User";
  },

  // Get role display name
  getRoleDisplayName(role) {
    const roleNames = {
      super_admin: "Super Administrator",
      admin: "Administrator",
      manager: "Manager",
      operator: "Operator",
      user: "User",
    };

    return roleNames[role] || role;
  },
};

// Protected Route Component (for future use)
export const ProtectedRoute = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
}) => {
  const isAuthenticated = authUtils.isAuthenticated();
  const user = authUtils.getCurrentUser();

  if (!isAuthenticated) {
    // Redirect to login
    window.location.href = "/login";
    return null;
  }

  if (requiredRoles.length > 0 && !authUtils.hasRole(requiredRoles)) {
    // Redirect to unauthorized page
    window.location.href = "/unauthorized";
    return null;
  }

  if (
    requiredPermissions.length > 0 &&
    !authUtils.hasPermission(requiredPermissions)
  ) {
    // Redirect to unauthorized page
    window.location.href = "/unauthorized";
    return null;
  }

  return children;
};

export default authUtils;
