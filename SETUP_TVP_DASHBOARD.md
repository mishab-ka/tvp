# TVP Owner Dashboard Setup Guide

## 🚗 **Updated Database Structure**

The TVP Owner Dashboard now uses a real database structure with the following tables:

### **1. Cars Table**

- `car_number` - Vehicle registration number
- `fleet_name` - Name of the fleet
- `deposit_amount` - Deposit amount for the vehicle
- `audit_tires` - Number of good tires (0-4)
- `audit_body` - Body condition (Good/Fair/Excellent)
- `audit_engine` - Engine condition (Good/Fair/Excellent)
- `audit_battery` - Battery condition (Good/Fair/Excellent)
- `audit_km` - Current kilometer reading
- `audit_photos` - Array of audit photo URLs
- `status` - Vehicle status (active/maintenance/inactive)

### **2. Hissab Transactions Table**

- `week_date` - Week ending date
- `total_trips` - Number of trips for the week
- `total_earnings` - Total earnings for the week
- `cash_collect` - Cash collected
- `toll` - Toll charges
- `adjustment_amount` - Adjustment amount
- `adjustment_description` - Description of adjustment
- `uber_transfer` - Uber transfer amount
- `total_outstanding` - Total outstanding amount
- `net_outstanding` - Net outstanding amount
- `car_id` - Reference to the car

### **3. Support Tickets Table**

- Standard support ticket structure (unchanged)

## 📋 **Setup Instructions**

### **Step 1: Create Database Tables**

Run the SQL script to create the new table structure:

```bash
# Connect to your Supabase database and run:
psql -h db.xyz.supabase.co -p 5432 -d postgres -U postgres.xyz -f CREATE_TVP_DASHBOARD_TABLES.sql
```

### **Step 2: Insert Sample Data**

Add sample data for testing:

```bash
psql -h db.xyz.supabase.co -p 5432 -d postgres -U postgres.xyz -f INSERT_TVP_SAMPLE_DATA.sql
```

### **Step 3: Verify Setup**

1. Login as TVP Owner: `tvpowner@tawaaq.com` / `TvpOwner123`
2. Navigate to `/dashboard` (will redirect to `/tvp-owner-dashboard`)
3. Check all three tabs:
   - **Cars List**: Shows car details with audit information
   - **Hissab**: Shows weekly financial data
   - **Support**: Shows support tickets

## 🎯 **Key Features**

### **Cars Tab**

- **Car Number & Fleet Name**: Primary identification
- **Deposit Amount**: Financial information
- **Audit Report**: 4 tires, body, engine, battery, KM
- **Audit Photos**: Array of photo URLs (ready for image display)
- **Status**: Active/Maintenance/Inactive

### **Hissab Tab**

- **Weekly Data**: Organized by week ending date
- **Financial Summary**: Total earnings, cash collect, outstanding amounts
- **Detailed Transactions**: Shows trips, earnings, cash, outstanding per week
- **Adjustments**: With descriptions and amounts
- **Uber Transfers**: Separate tracking

### **Support Tab**

- **Ticket Management**: Open, in-progress, resolved tickets
- **Priority Levels**: High, medium, low
- **Assignment Tracking**: Assigned to specific personnel

## 🔧 **Data Management**

### **For Administrators/Super Admins**

- **Add Cars**: Insert new vehicles with audit details
- **Update Hissab**: Add weekly transaction data
- **Manage Support**: Create and assign support tickets

### **For TVP Owners**

- **View Only**: Read-only access to all data
- **Real-time Updates**: Data updates automatically
- **Mobile Responsive**: Works on all devices

## 📱 **Mobile Responsiveness**

The dashboard is fully responsive and optimized for:

- **Desktop**: Full feature access
- **Tablet**: Optimized layout
- **Mobile**: Touch-friendly interface

## 🔐 **Security**

- **Row Level Security (RLS)**: TVP owners can only see their own data
- **Role-based Access**: Different permissions for different roles
- **Authentication Required**: All routes protected

## 🚀 **Ready to Use**

The TVP Owner Dashboard is now ready with:

- ✅ Real database integration
- ✅ Updated data structure
- ✅ Sample data for testing
- ✅ Mobile responsive design
- ✅ Security and permissions

**Login Credentials:**

- Email: `tvpowner@tawaaq.com`
- Password: `TvpOwner123`

The dashboard will automatically load real data from the database and display it in the updated format!
