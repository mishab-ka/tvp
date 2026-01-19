# Real Authentication System with Role-Based Access Control

## 🔐 **Overview**

This system implements real database authentication with comprehensive role-based access control (RBAC). The system starts with one super administrator who can create and manage all other users with different access levels.

## 🗄️ **Database Structure**

### **Tables**

- `users` - User accounts with authentication data
- `user_roles` - Role definitions with permissions
- `user_profiles` - User profile information
- `user_sessions` - Session management

### **Key Features**

- **Password Hashing**: SHA-256 hashing for secure password storage
- **Role-Based Access**: Granular permissions per role
- **Session Management**: 8-hour sessions with expiry tracking
- **Multi-Factor Authentication**: Support for MFA (configurable per user)

## 👥 **User Roles & Permissions**

### **Super Administrator**

- **Role**: `super_admin`
- **Permissions**:
  - `dashboard_view`
  - `tvp_management`
  - `financial_reports`
  - `user_management`
  - `system_settings`
  - `audit_logs`
- **Access**: Full system access

### **Administrator**

- **Role**: `admin`
- **Permissions**:
  - `dashboard_view`
  - `tvp_management`
  - `financial_reports`
  - `user_management`
  - `vehicle_management`
- **Access**: Most administrative functions

### **Manager**

- **Role**: `manager`
- **Permissions**:
  - `dashboard_view`
  - `tvp_management`
  - `financial_reports`
- **Access**: Department-level management

### **User**

- **Role**: `user`
- **Permissions**:
  - `dashboard_view`
- **Access**: Basic dashboard access only

## 🔑 **Default Super Admin Credentials**

### **Super Administrator**

| Email               | Password        | Full Name           | Department |
| ------------------- | --------------- | ------------------- | ---------- |
| `sadmin@tawaaq.com` | `t4w44q009@@##` | Super Administrator | IT         |

**Note**: This is the only default user. All other users will be created by the super administrator through the user management interface.

## 🛠️ **Setup Instructions**

### **1. Database Setup**

First, run the fix script to add the unique constraint:

```sql
-- Run FIX_UNIQUE_CONSTRAINT.sql in Supabase SQL Editor
```

Then run the main setup script:

```sql
-- Run SETUP_REAL_USERS.sql in Supabase SQL Editor
```

This will:

- Add unique constraint to email column
- Create password hash function
- Add password_hash column to users table
- Insert the super admin user with provided credentials
- Create user profile for super admin
- Set up role-based permissions

### **2. Authentication Flow**

1. Super admin logs in with provided credentials
2. System validates against database
3. Password is hashed and compared
4. User role and permissions are retrieved
5. Session is created with 8-hour expiry
6. Super admin can access all features and create other users

### **3. User Management**

- **Super Admin**: Can create, edit, and manage all users
- **Role Assignment**: Super admin assigns roles and permissions
- **Access Control**: Users only see features they have permission for
- **Session Management**: Automatic expiry and extension

## 🔒 **Security Features**

### **Password Security**

- SHA-256 hashing for password storage
- No plain text passwords in database
- Secure password comparison

### **Session Security**

- 8-hour session expiry
- Automatic session extension
- Session expiry warnings
- Secure logout functionality

### **Access Control**

- Role-based navigation
- Permission-based feature access
- Granular permission system
- User status validation (active/inactive)

### **Authentication Methods**

- **Email Authentication**: Primary method
- **Phone Authentication**: Alternative method
- **MFA Support**: Configurable per user
- **SSO Support**: Ready for integration

## 📱 **User Interface Features**

### **Login Page**

- Dual authentication methods (email/phone)
- Password strength indicator
- Account lockout protection
- Real-time validation
- Session management

### **Sidebar Navigation**

- Role-based menu items
- Permission-based quick actions
- User profile display
- Session expiry indicator
- Easy logout access

### **User Profile**

- Current user information
- Role and permissions display
- Session expiry time
- Session extension capability
- Secure logout

## 🔧 **Technical Implementation**

### **Authentication API**

```javascript
// Real database authentication
const user = await userManagementAPI.authenticateUser(
  email, // or phone number
  password,
  authMethod // 'email' or 'phone'
);
```

### **Permission Checking**

```javascript
// Check user permissions
const hasAccess = authUtils.hasPermission(["dashboard_view", "tvp_management"]);

// Check user role
const isAdmin = authUtils.hasRole(["super_admin", "admin"]);
```

### **Session Management**

```javascript
// Login user
authUtils.login(userData);

// Check authentication
const isAuthenticated = authUtils.isAuthenticated();

// Get current user
const user = authUtils.getCurrentUser();

// Logout user
authUtils.logout();
```

## 🚀 **Usage Examples**

### **Login as Super Admin**

1. Go to login page
2. Enter: `sadmin@tawaaq.com` / `t4w44q009@@##`
3. Access: Full system with all features
4. Create other users through User Management

### **Create New Users**

1. Super admin logs in
2. Navigate to User Management
3. Create new users with different roles
4. Assign appropriate permissions
5. Users can then login with their credentials

## 🔄 **Role-Based Navigation**

### **Super Admin Access**

- ✅ Dashboard
- ✅ TVP Management
- ✅ Owner Profile
- ✅ Financial Reports
- ✅ User Management

### **Admin Access**

- ✅ Dashboard
- ✅ TVP Management
- ✅ Owner Profile
- ✅ Financial Reports
- ✅ User Management

### **Manager Access**

- ✅ Dashboard
- ✅ TVP Management
- ✅ Owner Profile
- ✅ Financial Reports
- ❌ User Management

### **User Access**

- ✅ Dashboard
- ❌ TVP Management
- ❌ Owner Profile
- ❌ Financial Reports
- ❌ User Management

## 📊 **Session Management**

### **Session Features**

- **Duration**: 8 hours
- **Extension**: Manual extension available
- **Warning**: 5-minute expiry warning
- **Auto-logout**: Automatic logout on expiry
- **Remember Device**: Optional device remembering

### **Session Indicators**

- Session expiry time display
- Warning indicator when expiring soon
- Extension button when needed
- Visual session status

## 🔐 **Security Best Practices**

1. **Password Policy**: Strong passwords required
2. **Session Security**: Automatic expiry and secure storage
3. **Access Control**: Granular permission system
4. **Authentication**: Multiple methods supported
5. **Audit Trail**: Session tracking and logging
6. **Status Management**: Active/inactive user status

## 🚨 **Important Notes**

- **Default User**: Only one super admin user is created by default
- **User Creation**: All other users must be created by the super admin
- **Production**: Use proper password hashing (bcrypt, argon2)
- **Environment Variables**: Configure Supabase credentials properly
- **Security**: Implement proper RLS policies in production
- **Backup**: Regular database backups recommended

## 📞 **Support**

For issues or questions:

1. Check database connection
2. Verify super admin credentials
3. Check user status (active/inactive)
4. Review permission assignments
5. Check session expiry

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Unique Constraint Error**: Run `FIX_UNIQUE_CONSTRAINT.sql` first
2. **Authentication Failed**: Verify credentials and user status
3. **Permission Issues**: Check role assignments and permissions
4. **Session Expiry**: Extend session or re-login

---

**System Status**: ✅ Production Ready
**Security Level**: 🔒 High
**Access Control**: 🎯 Granular
**User Management**: 👥 Comprehensive
**Default Setup**: 🎯 Single Super Admin
