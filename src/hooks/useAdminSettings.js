import { useState, useEffect, useCallback } from "react";
import {
  getSettingValue,
  upsertSetting,
  getAllSettings,
} from "../lib/adminSettingsAPI";

/**
 * Custom hook for managing admin settings
 * Loads all settings and provides helper functions for calculations
 */
export const useAdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fleet Expenses
  const [fleetRentSlabs, setFleetRentSlabs] = useState([]);

  // Company Earnings
  const [companyEarningsSlabs, setCompanyEarningsSlabs] = useState([]);
  const [companyEarningsSlabs24hr, setCompanyEarningsSlabs24hr] = useState([]);
  const [vehiclePerformanceRentalIncome, setVehiclePerformanceRentalIncome] =
    useState(0);

  // General Settings
  const [companyInfo, setCompanyInfo] = useState({
    company_name: "Tawaaq Fleet LLP",
    contact_email: "admin@tawaaq.com",
    contact_phone: "+91 9606393089",
  });

  // Notifications
  const [notificationPreferences, setNotificationPreferences] = useState({
    email_notifications: true,
    sms_notifications: false,
    new_report_notifications: true,
  });

  // System Config
  const [systemConfig, setSystemConfig] = useState({
    dark_mode: false,
    debug_mode: false,
    maintenance_mode: false,
    api_key: "",
  });

  // Penalty Division
  const [penaltyDivisionSettings, setPenaltyDivisionSettings] = useState({
    division_days: 7,
    enabled: true,
    auto_apply: true,
  });

  // Load all settings
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔄 Loading admin settings...");

      // Load all settings in parallel
      const [
        rentSlabs,
        earningsSlabs,
        earningsSlabs24hr,
        rentalIncome,
        info,
        notifPrefs,
        sysConfig,
        penaltySettings,
      ] = await Promise.all([
        getSettingValue("fleet_expense", "rent_slabs", []),
        getSettingValue("company_earnings", "earnings_slabs", []),
        getSettingValue("company_earnings", "earnings_slabs_24hr", []),
        getSettingValue(
          "company_earnings",
          "vehicle_performance_rental_income",
          0
        ),
        getSettingValue("general", "company_info", {
          company_name: "Tawaaq Fleet LLP",
          contact_email: "admin@tawaaq.com",
          contact_phone: "+91 9606393089",
        }),
        getSettingValue("notifications", "preferences", {
          email_notifications: true,
          sms_notifications: false,
          new_report_notifications: true,
        }),
        getSettingValue("system", "config", {
          dark_mode: false,
          debug_mode: false,
          maintenance_mode: false,
          api_key: "",
        }),
        getSettingValue("penalty_division", "division_period", {
          division_days: 7,
          enabled: true,
          auto_apply: true,
        }),
      ]);

      // Validate and set state
      const validRentSlabs = Array.isArray(rentSlabs) ? rentSlabs : [];
      const validEarningsSlabs = Array.isArray(earningsSlabs)
        ? earningsSlabs
        : [];
      const validEarningsSlabs24hr = Array.isArray(earningsSlabs24hr)
        ? earningsSlabs24hr
        : [];

      console.log("📊 Loaded settings:", {
        fleetRentSlabs: validRentSlabs.length,
        companyEarningsSlabs: validEarningsSlabs.length,
        companyEarningsSlabs24hr: validEarningsSlabs24hr.length,
      });

      setFleetRentSlabs(validRentSlabs);
      setCompanyEarningsSlabs(validEarningsSlabs);
      setCompanyEarningsSlabs24hr(validEarningsSlabs24hr);
      setVehiclePerformanceRentalIncome(
        typeof rentalIncome === "number" ? rentalIncome : 0
      );
      setCompanyInfo(
        typeof info === "object" && info !== null
          ? info
          : {
              company_name: "Tawaaq Fleet LLP",
              contact_email: "admin@tawaaq.com",
              contact_phone: "+91 9606393089",
            }
      );
      setNotificationPreferences(
        typeof notifPrefs === "object" && notifPrefs !== null
          ? notifPrefs
          : {
              email_notifications: true,
              sms_notifications: false,
              new_report_notifications: true,
            }
      );
      setSystemConfig(
        typeof sysConfig === "object" && sysConfig !== null
          ? sysConfig
          : {
              dark_mode: false,
              debug_mode: false,
              maintenance_mode: false,
              api_key: "",
            }
      );
      setPenaltyDivisionSettings(
        typeof penaltySettings === "object" && penaltySettings !== null
          ? penaltySettings
          : {
              division_days: 7,
              enabled: true,
              auto_apply: true,
            }
      );

      console.log("✅ Settings loaded successfully");
    } catch (err) {
      console.error("❌ Error loading settings:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Calculation functions
  const calculateFleetRent = useCallback(
    (tripCount) => {
      const slab = fleetRentSlabs.find(
        (slab) =>
          tripCount >= slab.min_trips &&
          (slab.max_trips === null || tripCount <= slab.max_trips)
      );
      return slab?.amount || 0;
    },
    [fleetRentSlabs]
  );

  const calculateCompanyEarnings = useCallback(
    (tripCount) => {
      const slab = companyEarningsSlabs.find(
        (slab) =>
          tripCount >= slab.min_trips &&
          (slab.max_trips === null || tripCount <= slab.max_trips)
      );
      return slab?.amount || 0;
    },
    [companyEarningsSlabs]
  );

  const calculateCompanyEarnings24hr = useCallback(
    (tripCount) => {
      const slab = companyEarningsSlabs24hr.find(
        (slab) =>
          tripCount >= slab.min_trips &&
          (slab.max_trips === null || tripCount <= slab.max_trips)
      );
      return slab?.amount || 0;
    },
    [companyEarningsSlabs24hr]
  );

  // Update functions
  const updateFleetRentSlabs = useCallback(async (slabs) => {
    try {
      if (!Array.isArray(slabs) || slabs.length === 0) {
        throw new Error("Slabs array cannot be empty");
      }

      // Validate and clean slabs
      const validSlabs = slabs
        .map((slab) => ({
          min_trips: Number(slab.min_trips) || 0,
          max_trips:
            slab.max_trips === null ||
            slab.max_trips === "" ||
            slab.max_trips === undefined
              ? null
              : Number(slab.max_trips),
          amount: Number(slab.amount) || 0,
        }))
        .filter((slab) => {
          // Only filter out slabs where amount is truly invalid (NaN or negative)
          return !isNaN(slab.amount) && slab.amount >= 0;
        });

      if (validSlabs.length === 0) {
        throw new Error(
          "No valid slabs to save. Please ensure all slabs have valid amounts."
        );
      }

      // Sort slabs by min_trips
      const sortedSlabs = [...validSlabs].sort(
        (a, b) => a.min_trips - b.min_trips
      );

      console.log("Saving fleet rent slabs:", sortedSlabs);

      // Save to database
      const result = await upsertSetting(
        "fleet_expense",
        "rent_slabs",
        sortedSlabs,
        "Fleet rent expense calculation based on trip count"
      );

      console.log("Fleet rent slabs saved successfully:", result);

      // Update local state immediately (don't wait for reload)
      setFleetRentSlabs(sortedSlabs);
    } catch (err) {
      console.error("Error updating fleet rent slabs:", err);
      throw err;
    }
  }, []);

  const updateCompanyEarningsSlabs = useCallback(async (slabs) => {
    try {
      const validSlabs = slabs
        .map((slab) => ({
          min_trips: Number(slab.min_trips) || 0,
          max_trips:
            slab.max_trips === null || slab.max_trips === ""
              ? null
              : Number(slab.max_trips),
          amount: Number(slab.amount) || 0,
        }))
        .filter((slab) => slab.amount > 0);
      const sortedSlabs = [...validSlabs].sort(
        (a, b) => a.min_trips - b.min_trips
      );
      await upsertSetting(
        "company_earnings",
        "earnings_slabs",
        sortedSlabs,
        "Company earnings calculation based on trip count for regular shifts"
      );
      setCompanyEarningsSlabs(sortedSlabs);
    } catch (err) {
      console.error("Error updating company earnings slabs:", err);
      throw err;
    }
  }, []);

  const updateCompanyEarningsSlabs24hr = useCallback(async (slabs) => {
    try {
      const validSlabs = slabs
        .map((slab) => ({
          min_trips: Number(slab.min_trips) || 0,
          max_trips:
            slab.max_trips === null || slab.max_trips === ""
              ? null
              : Number(slab.max_trips),
          amount: Number(slab.amount) || 0,
        }))
        .filter((slab) => slab.amount > 0);
      const sortedSlabs = [...validSlabs].sort(
        (a, b) => a.min_trips - b.min_trips
      );
      await upsertSetting(
        "company_earnings",
        "earnings_slabs_24hr",
        sortedSlabs,
        "Company earnings calculation for 24-hour shifts"
      );
      setCompanyEarningsSlabs24hr(sortedSlabs);
    } catch (err) {
      console.error("Error updating company earnings slabs 24hr:", err);
      throw err;
    }
  }, []);

  const updateVehiclePerformanceRentalIncome = useCallback(async (amount) => {
    try {
      const numAmount = Number(amount) || 0;
      await upsertSetting(
        "company_earnings",
        "vehicle_performance_rental_income",
        numAmount,
        "Fixed rental income amount for Vehicle Performance tab"
      );
      setVehiclePerformanceRentalIncome(numAmount);
    } catch (err) {
      console.error("Error updating vehicle performance rental income:", err);
      throw err;
    }
  }, []);

  const updateCompanyInfo = useCallback(async (info) => {
    try {
      await upsertSetting(
        "general",
        "company_info",
        info,
        "General company information"
      );
      setCompanyInfo(info);
    } catch (err) {
      console.error("Error updating company info:", err);
      throw err;
    }
  }, []);

  const updateNotificationPreferences = useCallback(async (prefs) => {
    try {
      await upsertSetting(
        "notifications",
        "preferences",
        prefs,
        "Notification preferences"
      );
      setNotificationPreferences(prefs);
    } catch (err) {
      console.error("Error updating notification preferences:", err);
      throw err;
    }
  }, []);

  const updateSystemConfig = useCallback(async (config) => {
    try {
      await upsertSetting(
        "system",
        "config",
        config,
        "System configuration settings"
      );
      setSystemConfig(config);
    } catch (err) {
      console.error("Error updating system config:", err);
      throw err;
    }
  }, []);

  const updatePenaltyDivisionSettings = useCallback(async (settings) => {
    try {
      await upsertSetting(
        "penalty_division",
        "division_period",
        settings,
        "Penalty division period in days and settings"
      );
      setPenaltyDivisionSettings(settings);
    } catch (err) {
      console.error("Error updating penalty division settings:", err);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    fleetRentSlabs,
    companyEarningsSlabs,
    companyEarningsSlabs24hr,
    vehiclePerformanceRentalIncome,
    companyInfo,
    notificationPreferences,
    systemConfig,
    penaltyDivisionSettings,
    updateFleetRentSlabs,
    updateCompanyEarningsSlabs,
    updateCompanyEarningsSlabs24hr,
    updateVehiclePerformanceRentalIncome,
    updateCompanyInfo,
    updateNotificationPreferences,
    updateSystemConfig,
    updatePenaltyDivisionSettings,
    calculateFleetRent,
    calculateCompanyEarnings,
    calculateCompanyEarnings24hr,
    loadSettings,
  };
};
