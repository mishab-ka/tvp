import { supabase } from "./supabase";

/**
 * Admin Settings API - Manage dynamic configuration settings
 */

// Get a setting by type and key
export const getSetting = async (settingType, settingKey) => {
  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("*")
      .eq("setting_type", settingType)
      .eq("setting_key", settingKey)
      .single();

    if (error) {
      // Return null if not found (not an error)
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error(`Error getting setting ${settingType}.${settingKey}:`, error);
    throw error;
  }
};

// Get all settings by type
export const getSettingsByType = async (settingType) => {
  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("*")
      .eq("setting_type", settingType);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error getting settings for type ${settingType}:`, error);
    throw error;
  }
};

// Get all settings
export const getAllSettings = async () => {
  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("*")
      .order("setting_type", { ascending: true })
      .order("setting_key", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error getting all settings:", error);
    throw error;
  }
};

// Upsert a setting (create or update)
export const upsertSetting = async (
  settingType,
  settingKey,
  settingValue,
  description = null
) => {
  try {
    // Get current user ID for audit trail
    const sessionData = localStorage.getItem("tawaaq_session");
    let userId = null;
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        userId = parsed.id || parsed.user?.id || null;
      } catch (e) {
        console.warn("Could not parse session data for user ID");
      }
    }

    // Get existing setting to check if it exists (but don't fail if it doesn't)
    let existing = null;
    try {
      existing = await getSetting(settingType, settingKey);
    } catch (err) {
      // Setting doesn't exist yet, which is fine
      existing = null;
    }

    const payload = {
      setting_type: settingType,
      setting_key: settingKey,
      setting_value: settingValue,
      updated_at: new Date().toISOString(),
    };

    // Only include description if provided
    if (description !== null && description !== undefined) {
      payload.description = description;
    }

    // Only include user IDs if we have a valid user ID
    // The columns are nullable, so we can safely omit them if userId is null
    if (userId) {
      payload.updated_by = userId;
      // If creating new, set created_by as well
      if (!existing) {
        payload.created_by = userId;
      }
    }

    console.log(`Upserting setting ${settingType}:${settingKey}`, payload);

    const { data, error } = await supabase
      .from("admin_settings")
      .upsert(payload, {
        onConflict: "setting_type,setting_key",
      })
      .select()
      .single();

    if (error) {
      console.error(`Upsert error for ${settingType}:${settingKey}:`, error);
      console.error("Payload was:", payload);
      throw new Error(`Failed to save setting: ${error.message}`);
    }

    console.log(
      `Successfully upserted setting ${settingType}:${settingKey}`,
      data
    );
    return data;
  } catch (error) {
    console.error(
      `Error upserting setting ${settingType}.${settingKey}:`,
      error
    );
    throw error;
  }
};

// Delete a setting
export const deleteSetting = async (settingType, settingKey) => {
  try {
    const { error } = await supabase
      .from("admin_settings")
      .delete()
      .eq("setting_type", settingType)
      .eq("setting_key", settingKey);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(
      `Error deleting setting ${settingType}.${settingKey}:`,
      error
    );
    throw error;
  }
};

// Helper function to get setting value (returns the JSONB value directly)
export const getSettingValue = async (
  settingType,
  settingKey,
  defaultValue = null
) => {
  try {
    const setting = await getSetting(settingType, settingKey);
    if (
      setting &&
      setting.setting_value !== null &&
      setting.setting_value !== undefined
    ) {
      console.log(
        `✅ Fetched ${settingType}:${settingKey}:`,
        setting.setting_value
      );
      return setting.setting_value;
    }
    console.warn(
      `⚠️ Setting ${settingType}:${settingKey} not found, using default:`,
      defaultValue
    );
    return defaultValue;
  } catch (error) {
    console.error(
      `❌ Error getting setting value ${settingType}.${settingKey}:`,
      error
    );
    return defaultValue;
  }
};
