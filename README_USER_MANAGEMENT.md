# User Management System Guide

## 🔐 **Overview**

The Tawaaq Admin Portal includes a comprehensive user management system that allows super administrators to create, manage, and assign roles to other users. This system ensures that only authorized users can access the platform based on their assigned roles and permissions.

## 👥 **User Roles & Hierarchy**

### **Super Administrator (Super Admin)**

- **Role**: `super_admin`
- **Permissions**: All permissions
- **Access**: Full system access including user management
- **Can Create**: All other user types
- **Default User**: `sadmin@tawaaq.com` / `t4w44q009@@##`

### **Administrator (Admin)**

- **Role**: `admin`
- **Permissions**:
  - `dashboard_view`
  - `tvp_management`
  - `financial_reports`
  - `user_management`
  - `vehicle_management`
- **Access**: Most administrative functions
- **Can Create**: Limited user management

### **Manager**

- **Role**: `manager`
- **Permissions**:
  - `dashboard_view`
  - `tvp_management`
  - `financial_reports`
- **Access**: Department-level management
- **Can Create**: No user management

### **User**

- **Role**: `user`
- **Permissions**:
  - `dashboard_view`
- **Access**: Basic dashboard access only
- **Can Create**: No user management

### **TVP Owner**

- **Role**: `tvp_owner`
- **Permissions**:
  - `cars_list` - View fleet of assigned vehicles
  - `hissab_view` - View financial statements and accounting
  - `support_access` - Access support system
- **Access**: Fleet management and financial overview
- **Can Create**: No user management
- **Features**: Read-only access to assigned vehicles and financial data

## 🛠️ **How to Create New Users**

### **Step 1: Login as Super Admin**

1. Go to the login page
2. Use super admin credentials: `sadmin@tawaaq.com` / `t4w44q009@@##`
3. Access the system with full permissions

### **Step 2: Access User Management**

1. Navigate to **User Management** in the sidebar
2. Click the **"Add User"** button
3. Fill out the user creation form

### **Step 3: Create User Form**

Fill in the following information:

#### **Account Information**

- **Email Address**: User's email (required)
- **Password**: Secure password (required, min 6 characters)
- **Confirm Password**: Must match password
- **Role**: Select appropriate role (required)

#### **Profile Information**

- **Full Name**: User's full name (required)
- **Phone Number**: Contact number (optional)
- **Department**: User's department (optional)
- **Status**: Active/Inactive/Suspended

#### **Security Settings**

- **SSO Enabled**: Enable Single Sign-On (optional)
- **MFA Enabled**: Enable Multi-Factor Authentication (optional)

### **Step 4: Save User**

1. Review all information
2. Click **"Create User"**
3. User is created and can immediately login

## 🔑 **User Login Process**

### **For Newly Created Users**

1. **Go to login page**
2. **Enter credentials**:
   - Email: The email you created
   - Password: The password you set
3. **Access granted** based on assigned role

### **Role-Based Access After Login**

- **Super Admin**: Full access to all features
- **Admin**: Access to most administrative features
- **Manager**: Access to department management features
- **TVP Owner**: Fleet management and financial overview
- **User**: Basic dashboard access only

## 📋 **User Management Features**

### **View All Users**

- **User List**: See all created users
- **Search & Filter**: Find users by name, email, role, department
- **Sort Options**: Sort by name, role, status, last login

### **Edit Users**

- **Update Profile**: Change name, phone, department
- **Change Role**: Assign different roles
- **Update Status**: Activate/deactivate users
- **Security Settings**: Enable/disable SSO and MFA

### **Bulk Actions**

- **Select Multiple Users**: Choose several users at once
- **Bulk Activate**: Activate multiple users
- **Bulk Deactivate**: Deactivate multiple users
- **Bulk Delete**: Remove multiple users (use with caution)

### **User Details**

- **Profile Information**: View complete user profile
- **Login History**: See last login times
- **Permissions**: View assigned permissions
- **Session Status**: Check current session status

## 🔒 **Security Features**

### **Password Security**

- **Hashed Storage**: Passwords are securely hashed using SHA-256
- **No Plain Text**: Passwords are never stored in plain text
- **Secure Validation**: Password verification against database

### **Session Management**

- **8-Hour Sessions**: Automatic session expiry
- **Session Extension**: Users can extend sessions
- **Cross-Tab Sync**: Sessions synchronized across browser tabs
- **Secure Logout**: Complete session cleanup

### **Access Control**

- **Role-Based Access**: Features restricted by role
- **Permission-Based**: Granular permission system
- **Route Protection**: Unauthorized access blocked
- **Authentication Required**: All protected routes require login

## 📊 **User Statistics**

### **Dashboard Overview**

- **Total Users**: Count of all users
- **Active Users**: Currently active users
- **SSO Users**: Users with SSO enabled
- **MFA Users**: Users with MFA enabled

### **Department Breakdown**

- **IT Department**: System administrators
- **Operations**: Day-to-day operations
- **Finance**: Financial management
- **HR**: Human resources
- **Marketing**: Marketing activities
- **Sales**: Sales operations

## 🚀 **Quick Start Guide**

### **1. Initial Setup**

```bash
# Run database setup scripts
# 1. FIX_UNIQUE_CONSTRAINT.sql
# 2. SETUP_REAL_USERS.sql
```

### **2. Login as Super Admin**

```
Email: sadmin@tawaaq.com
Password: t4w44q009@@##
```

### **3. Create Your First Admin**

1. Go to User Management
2. Click "Add User"
3. Fill form:
   - Email: admin@yourcompany.com
   - Password: SecurePassword123
   - Role: Administrator
   - Full Name: Your Admin Name
4. Click "Create User"

### **4. Test New User Login**

1. Logout from super admin
2. Login with new admin credentials
3. Verify access to admin features

## 🔧 **Troubleshooting**

### **Common Issues**

#### **User Can't Login**

- **Check Email**: Verify email is correct
- **Check Password**: Ensure password matches
- **Check Status**: User must be "Active"
- **Check Role**: User must have valid role assigned

#### **Access Denied Errors**

- **Check Permissions**: User may not have required permissions
- **Check Role**: User role may not include needed access
- **Contact Super Admin**: Request role/permission changes

#### **User Creation Fails**

- **Email Already Exists**: Use different email address
- **Invalid Role**: Select valid role from dropdown
- **Password Too Weak**: Use stronger password
- **Database Error**: Check database connection

### **Support Contacts**

- **Super Admin**: sadmin@tawaaq.com
- **System Issues**: Contact IT department
- **Access Requests**: Contact your manager

## 📈 **Best Practices**

### **User Creation**

- **Strong Passwords**: Use complex passwords
- **Valid Emails**: Use real email addresses
- **Appropriate Roles**: Assign roles based on job function
- **Department Assignment**: Assign correct department

### **Security**

- **Regular Reviews**: Review user access regularly
- **Role Updates**: Update roles when job functions change
- **Account Cleanup**: Deactivate unused accounts
- **Password Policies**: Enforce strong password requirements

### **Management**

- **Documentation**: Keep records of user assignments
- **Training**: Train users on system features
- **Monitoring**: Monitor user activity and access
- **Backup**: Regular backup of user data

## 🎯 **Role Assignment Guidelines**

### **Super Admin**

- **Who**: System administrators, IT managers
- **When**: Full system access needed
- **Responsibilities**: User management, system configuration

### **Admin**

- **Who**: Department managers, senior staff
- **When**: Administrative functions needed
- **Responsibilities**: Team management, reporting

### **Manager**

- **Who**: Team leaders, project managers
- **When**: Department-level access needed
- **Responsibilities**: Team oversight, project management

### **User**

- **Who**: Regular employees, team members
- **When**: Basic system access needed
- **Responsibilities**: Daily tasks, data entry

### **TVP Owner**

- **Who**: Fleet owners, vehicle operators
- **When**: Fleet management and financial tracking needed
- **Responsibilities**: Monitor vehicles, track finances, request support

---

**System Status**: ✅ Production Ready
**Security Level**: 🔒 High
**User Management**: 👥 Comprehensive
**Access Control**: 🎯 Granular
**Documentation**: 📚 Complete
