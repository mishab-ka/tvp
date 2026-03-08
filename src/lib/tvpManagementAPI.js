import { supabase } from "./supabase";

/**
 * TVP Management API - Real data operations with Supabase
 */

const DOCUMENT_BUCKET = "tvp-owner-docs";
const DRIVER_TABLE = "tvp_drivers";

/** Compute week_start and week_end from a date string (YYYY-MM-DD) */
const getWeekFromDate = (dateStr) => {
  if (!dateStr) return { weekStart: null, weekEnd: null };
  const parts = String(dateStr).split("-");
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const dayOfWeek = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const pad = (n) => String(n).padStart(2, "0");
  return {
    weekStart: `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`,
    weekEnd: `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`,
  };
};

const calculatePerformanceScore = (paymentDelayDays = 0) => {
  const delay = Number(paymentDelayDays) || 0;
  const score = 100 - delay * 5;
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Generate the next TVP owner ID (TVP001, TVP002, etc.)
 * @returns {Promise<string>} The next TVP ID
 */
const generateNextTVPId = async () => {
  try {
    // Fetch all existing driver codes that match the TVP### pattern
    const { data: drivers, error } = await supabase
      .from(DRIVER_TABLE)
      .select("driver_code")
      .not("driver_code", "is", null)
      .like("driver_code", "TVP%");

    if (error) {
      console.error("Error fetching TVP IDs:", error);
      throw error;
    }

    // Extract numbers from existing TVP IDs
    const existingNumbers = (drivers || [])
      .map((driver) => {
        const match = driver.driver_code?.match(/^TVP(\d+)$/i);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((num) => num !== null)
      .sort((a, b) => b - a); // Sort descending

    // Get the highest number, or start from 0 if no existing IDs
    const nextNumber = existingNumbers.length > 0 ? existingNumbers[0] + 1 : 1;

    // Format as TVP### with zero-padding (3 digits)
    const tvpId = `TVP${String(nextNumber).padStart(3, "0")}`;

    return tvpId;
  } catch (error) {
    console.error("Error generating TVP ID:", error);
    // Fallback: generate based on timestamp if query fails
    const fallbackNumber = Math.floor(Date.now() / 1000) % 1000;
    return `TVP${String(fallbackNumber).padStart(3, "0")}`;
  }
};

const uploadOwnerDocument = async (file, ownerId, docType) => {
  if (!file) return null;
  const cleanedName =
    file.name?.replace(/\s+/g, "_").toLowerCase() || "document";
  const path = `${ownerId}/${docType}-${Date.now()}-${cleanedName}`;

  const { error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, file, { upsert: true });
  if (error) {
    console.error("Document upload error:", error);
    throw new Error(`Failed to upload ${docType} file`);
  }
  const { data } = supabase.storage.from(DOCUMENT_BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
};

const documentFieldMap = [
  {
    formKey: "aadharFront",
    column: "aadhar_front_url",
    prop: "aadharFrontUrl",
  },
  { formKey: "aadharBack", column: "aadhar_back_url", prop: "aadharBackUrl" },
  {
    formKey: "licenseFront",
    column: "license_front_url",
    prop: "licenseFrontUrl",
  },
  {
    formKey: "licenseBack",
    column: "license_back_url",
    prop: "licenseBackUrl",
  },
];

const extractDocumentsFromRow = (row = {}) =>
  documentFieldMap.reduce((acc, field) => {
    acc[field.prop] = row?.[field.column] || null;
    return acc;
  }, {});

const resolveDriverDocuments = async (
  driverId,
  documents = {},
  existingRow = {},
  removeKeys = []
) => {
  const docColumns = {};
  let hasNewUpload = false;

  for (const field of documentFieldMap) {
    if (removeKeys?.includes(field.formKey)) {
      docColumns[field.column] = null;
      hasNewUpload = true;
    } else if (documents?.[field.formKey]) {
      const url = await uploadOwnerDocument(
        documents[field.formKey],
        driverId,
        field.formKey
      );
      docColumns[field.column] = url;
      hasNewUpload = true;
    } else {
      docColumns[field.column] = existingRow?.[field.column] || null;
    }
  }

  return { docColumns, hasNewUpload };
};

/** Upload a single document or profile photo for a driver (driver app). */
export const uploadDriverDocument = async (driverId, formKey, file) => {
  if (!file || !driverId) return null;
  const docMap = [
    { formKey: "aadharFront", column: "aadhar_front_url" },
    { formKey: "aadharBack", column: "aadhar_back_url" },
    { formKey: "licenseFront", column: "license_front_url" },
    { formKey: "licenseBack", column: "license_back_url" },
    { formKey: "profilePhoto", column: "profile_photo_url" },
  ];
  const entry = docMap.find((d) => d.formKey === formKey);
  if (!entry) throw new Error("Invalid document type");
  const storageKey = formKey === "profilePhoto" ? "profile_photo" : formKey;
  const url = await uploadOwnerDocument(file, driverId, storageKey);
  if (!url) return null;
  const { error } = await supabase
    .from(DRIVER_TABLE)
    .update({ [entry.column]: url })
    .eq("id", driverId);
  if (error) throw error;
  return url;
};

/** Add one or more Uber profile photos for a driver (driver app). Appends to existing uber_driver_photos. */
export const addDriverUberPhoto = async (driverId, file) => {
  if (!file || !driverId) return null;
  const storageKey = `uber_driver_photo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const url = await uploadOwnerDocument(file, driverId, storageKey);
  if (!url) return null;
  const { data: row, error: fetchError } = await supabase
    .from(DRIVER_TABLE)
    .select("uber_driver_photos")
    .eq("id", driverId)
    .single();
  if (fetchError) throw fetchError;
  const existing = Array.isArray(row?.uber_driver_photos) ? row.uber_driver_photos : [];
  const updated = [...existing, url];
  const { error } = await supabase
    .from(DRIVER_TABLE)
    .update({ uber_driver_photos: updated })
    .eq("id", driverId);
  if (error) throw error;
  return url;
};

const mapDriverRow = (row) => {
  if (!row) return null;
  const raw = row.vehicle_numbers;
  const vehicleNumbers = Array.isArray(raw)
    ? raw.map((v) => (v != null ? String(v).trim() : "")).filter(Boolean)
    : raw != null && String(raw).trim() !== ""
      ? [String(raw).trim()]
      : [];
  const documents = extractDocumentsFromRow(row);

  return {
    id: row.id,
    tvpId:
      row.driver_code ||
      (row.id ? `DRV${row.id.slice(-6).toUpperCase()}` : "DRIVER"),
    name: row.full_name || row.email || "Unknown",
    phone: row.phone || "",
    email: row.email || "",
    address: row.address || "Address not provided",
    region: row.region || "Not Assigned",
    status: row.status || "active",
    category: row.category || "single_driver",
    cumulativeRentalDays: Number(row.cumulative_rental_days || 0),
    joinDate: row.join_date || row.created_at,
    vehicleNumbers,
    vehicles: vehicleNumbers.map((plate, index) => ({
      id: `${row.id}-${index}`,
      plateNumber: plate,
      status: row.status || "active",
    })),
    vehicleCount: vehicleNumbers.length,
    depositAmount: Number(row.deposit_amount || 0),
    outstandingBalance: Number(row.outstanding_balance || 0),
    netOutstanding: Number(row.net_outstanding ?? row.outstanding_balance ?? 0),
    totalEarnings: Number(row.total_earnings || 0),
    totalCashCollect: Number(row.total_cash_collect || 0),
    paymentDelayDays: Number(row.payment_delay_days || 0),
    performance:
      typeof row.performance_score === "number"
        ? Number(row.performance_score)
        : calculatePerformanceScore(row.payment_delay_days),
    roomDeposit: Number(row.room_deposit || row?.room_deposit || 0),
    prePaidRentAmount: Number(row.pre_paid_rent_amount || row?.pre_paid_rent_amount || 0),
    documentsCharge: Number(row.documents_charge || row?.documents_charge || 0),
    alternativePhone1: row.alternative_phone_1 || row?.alternative_phone_1 || "",
    alternativePhone2: row.alternative_phone_2 || row?.alternative_phone_2 || "",
    alternativePhone3: row.alternative_phone_3 || row?.alternative_phone_3 || "",
    uberDriverPhotos: row.uber_driver_photos || row?.uber_driver_photos || [],
    includingRoom: !!(row.including_room ?? row?.including_room),
    penaltyAmount: Number(row.penalty_amount || 0),
    documents,
    recentTransactions: row.recent_transactions || [],
    transactions: row.transactions || [],
    supportTickets: [],
    operator: !!(row.operator ?? row?.operator),
    profilePhotoUrl: row.profile_photo_url || null,
  };
};

const fetchDriverRowById = async (driverId) => {
  try {
  const { data, error } = await supabase
    .from(DRIVER_TABLE)
    .select("*")
    .eq("id", driverId)
    .single();
    
    if (error) {
      // If schema cache error, the columns might exist but cache is stale
      if (error.code === 'PGRST204' || error.message?.includes('schema cache')) {
        console.warn('Schema cache error for driver:', driverId, error);
        throw new Error('Database schema cache is outdated. Please refresh your Supabase project schema cache or wait a few moments and try again.');
      }
      throw error;
    }
  return data;
  } catch (error) {
    console.error("Error fetching driver row:", error);
    throw error;
  }
};

// Get all TVP owners with their details
export const getAllTVPOwners = async () => {
  try {
    const { data, error } = await supabase
      .from(DRIVER_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      // If error is about missing columns in schema cache, provide helpful message
      if (error.code === 'PGRST204' || error.message?.includes('schema cache')) {
        console.error('PostgREST schema cache error:', error.message);
        throw new Error('Database schema cache is outdated. Please run the migration script (ADD_DRIVER_ADDITIONAL_FIELDS.sql) in Supabase SQL Editor, then refresh the schema cache by restarting your Supabase project or waiting 5-30 seconds.');
      }
      throw error;
    }
    return (data || []).map(mapDriverRow);
  } catch (error) {
    console.error("Error fetching TVP drivers:", error);
    throw error;
  }
};

// Get single TVP owner with complete details
export const getTVPOwnerDetails = async (ownerId) => {
  try {
    const driverRow = await fetchDriverRowById(ownerId);
    return mapDriverRow(driverRow);
  } catch (error) {
    console.error("Error fetching TVP driver details:", error);
    throw error;
  }
};

/** Get TVP driver/operator by email (for login redirect). */
export const getTVPDriverByEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .from(DRIVER_TABLE)
      .select("*")
      .ilike("email", (email || "").trim())
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? mapDriverRow(data) : null;
  } catch (error) {
    console.error("Error fetching TVP driver by email:", error);
    return null;
  }
};

// Get aggregated statistics for all TVP owners
export const getTVPOwnersStatistics = async () => {
  try {
    const { data, error } = await supabase
      .from(DRIVER_TABLE)
      .select("status, outstanding_balance, deposit_amount");

    if (error) throw error;

    const drivers = data || [];

    // Calculate totals
    const totalOutstanding = drivers.reduce(
      (sum, d) => sum + Number(d.outstanding_balance || 0),
      0
    );
    const totalDeposit = drivers.reduce(
      (sum, d) => sum + Number(d.deposit_amount || 0),
      0
    );

    // Count by status
    const statusCounts = {
      active: 0,
      inactive: 0,
      pending: 0,
      suspended: 0,
      under_review: 0,
    };
    drivers.forEach((d) => {
      const status = d.status || "active";
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });

    return {
      totalDrivers: drivers.length,
      totalOutstanding,
      totalDeposit,
      activeCount: statusCounts.active,
      inactiveCount: statusCounts.inactive,
      pendingCount: statusCounts.pending,
      suspendedCount: statusCounts.suspended,
      underReviewCount: statusCounts.under_review,
    };
  } catch (error) {
    console.error("Error fetching TVP owners statistics:", error);
    throw error;
  }
};

export const createTVPOwner = async (formValues) => {
  try {
    // Generate the next TVP ID
    const tvpId = await generateNextTVPId();

    const buildInsertPayload = (includeIncludingRoom = true) => {
      const base = {
        driver_code: tvpId,
        full_name: formValues.name,
        email: formValues.email?.trim() || null,
        phone: formValues.phone || null,
        address: formValues.address || null,
        region: formValues.region || null,
        status: formValues.status || "active",
        category: formValues.category || "single_driver",
        cumulative_rental_days: 0,
        deposit_amount: formValues.depositAmount || 0,
        outstanding_balance: formValues.outstandingBalance || 0,
        net_outstanding: formValues.outstandingBalance || 0,
        payment_delay_days: formValues.paymentDelayDays || 0,
        performance_score:
          formValues.performance ??
          calculatePerformanceScore(formValues.paymentDelayDays),
        total_earnings: formValues.totalEarnings || 0,
        total_cash_collect: formValues.totalCashCollect || 0,
        vehicle_numbers: formValues.vehicleNumbers || [],
        room_deposit: formValues.roomDeposit || 0,
        pre_paid_rent_amount: formValues.prePaidRentAmount || 0,
        documents_charge: formValues.documentsCharge || 0,
        alternative_phone_1: formValues.alternativePhone1 || null,
        alternative_phone_2: formValues.alternativePhone2 || null,
        alternative_phone_3: formValues.alternativePhone3 || null,
        uber_driver_photos: [],
        penalty_amount: formValues.penaltyAmount ?? 0,
        operator: !!formValues.operator,
      };
      if (includeIncludingRoom) base.including_room = !!formValues.includingRoom;
      return base;
    };

    let insertPayload = buildInsertPayload(true);
    let result = await supabase
      .from(DRIVER_TABLE)
      .insert(insertPayload)
      .select()
      .single();
    let driver = result.data;

    if (result.error) {
      const isIncludingRoomSchemaError =
        (result.error?.code === "PGRST204" || result.error?.message?.includes("schema cache")) &&
        (result.error?.message?.includes("including_room") || result.error?.message?.includes("including room"));
      if (isIncludingRoomSchemaError) {
        insertPayload = buildInsertPayload(false);
        const retry = await supabase
          .from(DRIVER_TABLE)
          .insert(insertPayload)
          .select()
          .single();
        if (retry.error) throw retry.error;
        driver = retry.data;
      } else {
        throw result.error;
      }
    }

    const documentsPayload = formValues.documents || {};
    const removeDocuments = formValues.removeDocuments || [];

    // Upload Uber driver photos if provided
    let uberPhotoUrls = formValues.existingUberPhotos || [];
    if (formValues.uberDriverPhotos && Array.isArray(formValues.uberDriverPhotos)) {
      for (const photoFile of formValues.uberDriverPhotos) {
        if (photoFile instanceof File) {
          const photoUrl = await uploadOwnerDocument(
            photoFile,
            driver.id,
            `uber_driver_photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          );
          if (photoUrl) {
            uberPhotoUrls.push(photoUrl);
          }
        }
      }
    }

    const { docColumns, hasNewUpload } = await resolveDriverDocuments(
      driver.id,
      documentsPayload,
      {},
      removeDocuments
    );

    let finalDriver = driver;
    if (hasNewUpload || uberPhotoUrls.length > 0) {
      const updatePayload = {
        ...docColumns,
        uber_driver_photos: uberPhotoUrls.length > 0 ? uberPhotoUrls : driver.uber_driver_photos || [],
      };
      const { data: updatedDriver, error: docUpdateError } = await supabase
        .from(DRIVER_TABLE)
        .update(updatePayload)
        .eq("id", driver.id)
        .select()
        .single();
      if (docUpdateError) throw docUpdateError;
      finalDriver = updatedDriver;
    }

    return mapDriverRow({ ...finalDriver, ...docColumns });
  } catch (error) {
    console.error("Error creating TVP driver:", error);
    throw error;
  }
};

/**
 * Generate a unique driver_code for self-registration (avoids duplicate key with TVP###).
 */
const generateRegistrationDriverCode = (isOperator) => {
  const prefix = isOperator ? "OPR" : "DRV";
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `${prefix}-${unique}`;
};

/**
 * Register a new driver or operator from the login page.
 * Creates Supabase Auth user (email/password) and a tvp_drivers row.
 * Optional: address, alternativePhone1/2/3, profilePhoto, documents (aadharFront/Back, licenseFront/Back), uberDriverPhotos (File[]).
 */
export const registerTVPDriverOrOperator = async ({
  name,
  phone,
  email,
  operator,
  password,
  address = null,
  alternativePhone1 = null,
  alternativePhone2 = null,
  alternativePhone3 = null,
  profilePhoto = null,
  documents = {},
  uberDriverPhotos = [],
}) => {
  try {
    const { error: authError } = await supabase.auth.signUp({
      email: email?.trim(),
      password,
      options: { emailRedirectTo: undefined },
    });

    if (authError) {
      if (authError.message?.includes("already registered") || authError.code === "user_already_exists") {
        throw new Error("An account with this email already exists.");
      }
      throw new Error(authError.message || "Sign up failed.");
    }

    const driverCode = generateRegistrationDriverCode(!!operator);
    const insertPayload = {
      driver_code: driverCode,
      full_name: name?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      region: null,
      status: "pending",
      category: "single_driver",
      cumulative_rental_days: 0,
      deposit_amount: 0,
      outstanding_balance: 0,
      net_outstanding: 0,
      payment_delay_days: 0,
      performance_score: 100,
      total_earnings: 0,
      total_cash_collect: 0,
      vehicle_numbers: [],
      room_deposit: 0,
      pre_paid_rent_amount: 0,
      documents_charge: 0,
      alternative_phone_1: alternativePhone1?.trim() || null,
      alternative_phone_2: alternativePhone2?.trim() || null,
      alternative_phone_3: alternativePhone3?.trim() || null,
      uber_driver_photos: [],
      penalty_amount: 0,
      operator: !!operator,
    };

    let { data: driver, error: insertError } = await supabase
      .from(DRIVER_TABLE)
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "PGRST204" || insertError.message?.includes("operator")) {
        const { operator: _o, ...payloadWithoutOperator } = insertPayload;
        const { data: retryDriver, error: retryError } = await supabase
          .from(DRIVER_TABLE)
          .insert(payloadWithoutOperator)
          .select()
          .single();
        if (retryError) throw retryError;
        driver = retryDriver;
      } else if (insertError.code === "23505" || insertError.message?.includes("duplicate key") || insertError.message?.includes("driver_code")) {
        insertPayload.driver_code = generateRegistrationDriverCode(!!operator);
        const { data: retryDriver, error: retryError } = await supabase
          .from(DRIVER_TABLE)
          .insert(insertPayload)
          .select()
          .single();
        if (retryError) throw new Error(retryError.message || "Failed to create driver/operator record.");
        driver = retryDriver;
      } else {
        throw new Error(insertError.message || "Failed to create driver/operator record.");
      }
    }

    const driverId = driver?.id;
    if (!driverId) return mapDriverRow(driver);

    const updatePayload = {};

    if (profilePhoto && profilePhoto instanceof File) {
      const url = await uploadOwnerDocument(profilePhoto, driverId, "profile_photo");
      if (url) updatePayload.profile_photo_url = url;
    }

    const docKeys = ["aadharFront", "aadharBack", "licenseFront", "licenseBack"];
    for (const key of docKeys) {
      const file = documents[key];
      if (file && file instanceof File) {
        const url = await uploadOwnerDocument(file, driverId, key);
        if (url) {
          const col = documentFieldMap.find((f) => f.formKey === key);
          if (col) updatePayload[col.column] = url;
        }
      }
    }

    const uberUrls = [];
    if (Array.isArray(uberDriverPhotos)) {
      for (const file of uberDriverPhotos) {
        if (file && file instanceof File) {
          const url = await uploadOwnerDocument(
            file,
            driverId,
            `uber_driver_photo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
          );
          if (url) uberUrls.push(url);
        }
      }
    }
    if (uberUrls.length > 0) updatePayload.uber_driver_photos = uberUrls;

    if (Object.keys(updatePayload).length > 0) {
      const { data: updated, error: updateErr } = await supabase
        .from(DRIVER_TABLE)
        .update(updatePayload)
        .eq("id", driverId)
        .select()
        .single();
      if (!updateErr && updated) driver = updated;
    }

    return mapDriverRow(driver);
  } catch (error) {
    console.error("Error in registerTVPDriverOrOperator:", error);
    throw error;
  }
};

export const updateTVPOwner = async (ownerId, formValues) => {
  try {
    const existingRow = await fetchDriverRowById(ownerId);
    const documentsPayload = formValues.documents || {};
    const removeDocuments = formValues.removeDocuments || [];

    // Upload new Uber driver photos if provided
    let uberPhotoUrls = formValues.existingUberPhotos || existingRow.uber_driver_photos || [];
    if (formValues.uberDriverPhotos && Array.isArray(formValues.uberDriverPhotos)) {
      for (const photoFile of formValues.uberDriverPhotos) {
        if (photoFile instanceof File) {
          const photoUrl = await uploadOwnerDocument(
            photoFile,
            ownerId,
            `uber_driver_photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          );
          if (photoUrl) {
            uberPhotoUrls.push(photoUrl);
          }
        }
      }
    }

    const { docColumns } = await resolveDriverDocuments(
      ownerId,
      documentsPayload,
      existingRow,
      removeDocuments
    );

    const buildPayload = (includeIncludingRoom = true) => {
      const base = {
        full_name: formValues.name,
        email: formValues.email?.trim() || existingRow.email,
        phone: formValues.phone || existingRow.phone,
        address: formValues.address || existingRow.address,
        region: formValues.region || existingRow.region,
        status: formValues.status || existingRow.status || "active",
        category: formValues.category ?? existingRow.category ?? "single_driver",
        cumulative_rental_days:
          formValues.cumulativeRentalDays ??
          existingRow.cumulative_rental_days ??
          0,
        deposit_amount:
          formValues.depositAmount ?? existingRow.deposit_amount ?? 0,
        outstanding_balance:
          formValues.outstandingBalance ?? existingRow.outstanding_balance ?? 0,
        net_outstanding:
          formValues.outstandingBalance ??
          existingRow.net_outstanding ??
          existingRow.outstanding_balance ??
          0,
        payment_delay_days:
          formValues.paymentDelayDays ?? existingRow.payment_delay_days ?? 0,
        performance_score:
          formValues.performance ??
          calculatePerformanceScore(
            formValues.paymentDelayDays ?? existingRow.payment_delay_days
          ),
        total_earnings:
          formValues.totalEarnings ?? existingRow.total_earnings ?? 0,
        total_cash_collect:
          formValues.totalCashCollect ?? existingRow.total_cash_collect ?? 0,
        vehicle_numbers:
          Array.isArray(formValues.vehicleNumbers)
            ? formValues.vehicleNumbers
            : (existingRow.vehicle_numbers ?? []),
        room_deposit: formValues.roomDeposit ?? existingRow.room_deposit ?? 0,
        pre_paid_rent_amount: formValues.prePaidRentAmount ?? existingRow.pre_paid_rent_amount ?? 0,
        documents_charge: formValues.documentsCharge ?? existingRow.documents_charge ?? 0,
        alternative_phone_1: formValues.alternativePhone1 ?? existingRow.alternative_phone_1 ?? null,
        alternative_phone_2: formValues.alternativePhone2 ?? existingRow.alternative_phone_2 ?? null,
        alternative_phone_3: formValues.alternativePhone3 ?? existingRow.alternative_phone_3 ?? null,
        uber_driver_photos: uberPhotoUrls,
        penalty_amount: formValues.penaltyAmount ?? existingRow.penalty_amount ?? 0,
        ...docColumns,
      };
      if (includeIncludingRoom) {
        base.including_room = formValues.includingRoom ?? existingRow.including_room ?? false;
      }
      return base;
    };

    let updatePayload = buildPayload(true);
    let { data, error } = await supabase
      .from(DRIVER_TABLE)
      .update(updatePayload)
      .eq("id", ownerId)
      .select()
      .single();

    if (error) {
      const isIncludingRoomSchemaError =
        (error?.code === "PGRST204" || error?.message?.includes("schema cache")) &&
        (error?.message?.includes("including_room") || error?.message?.includes("including room"));
      if (isIncludingRoomSchemaError) {
        updatePayload = buildPayload(false);
        const retry = await supabase
          .from(DRIVER_TABLE)
          .update(updatePayload)
          .eq("id", ownerId)
          .select()
          .single();
        if (retry.error) throw retry.error;
        return mapDriverRow(retry.data);
      }
      throw error;
    }

    return mapDriverRow(data);
  } catch (error) {
    console.error("Error updating TVP driver:", error);
    throw error;
  }
};

export const deleteTVPOwner = async (ownerId) => {
  try {
    const { error } = await supabase
      .from(DRIVER_TABLE)
      .delete()
      .eq("id", ownerId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting TVP driver:", error);
    throw error;
  }
};

// Add new vehicle to TVP owner (ownerId is optional)
export const addVehicleToOwner = async (ownerId, vehicleData) => {
  try {
    const insertData = {
        car_number: vehicleData.car_number,
        fleet_name: vehicleData.fleet_name,
        deposit_amount: vehicleData.deposit_amount,
        audit_km: vehicleData.audit_km,
        audit_tires: vehicleData.audit_tires,
        audit_body: vehicleData.audit_body,
        audit_engine: vehicleData.audit_engine,
        audit_battery: vehicleData.audit_battery,
        status: vehicleData.status || "active",
    };

    // Only include tvp_owner_id if it's provided and not empty
    if (ownerId && ownerId.trim() !== "") {
      insertData.tvp_owner_id = ownerId;
    } else {
      insertData.tvp_owner_id = null;
    }

    const { data, error } = await supabase
      .from("cars")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding vehicle:", error);
    throw error;
  }
};

// Update vehicle details
export const updateVehicle = async (vehicleId, vehicleData) => {
  try {
    // Prepare update data, ensure empty string becomes null for tvp_owner_id
    const updateData = { ...vehicleData };
    if (updateData.tvp_owner_id !== undefined) {
      updateData.tvp_owner_id = updateData.tvp_owner_id?.trim() || null;
    }

    const { data, error } = await supabase
      .from("cars")
      .update(updateData)
      .eq("id", vehicleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating vehicle:", error);
    throw error;
  }
};

// Delete vehicle
export const deleteVehicle = async (vehicleId) => {
  try {
    const { error } = await supabase.from("cars").delete().eq("id", vehicleId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    throw error;
  }
};

// Add hissab transaction
export const addHissabTransaction = async (ownerId, transactionData) => {
  try {
    const { data, error } = await supabase
      .from("hissab_transactions")
      .insert({
        tvp_owner_id: ownerId,
        week_date: transactionData.week_date,
        total_trips: transactionData.total_trips,
        total_earnings: transactionData.total_earnings,
        cash_collect: transactionData.cash_collect,
        toll: transactionData.toll,
        adjustment_amount: transactionData.adjustment_amount,
        adjustment_description: transactionData.adjustment_description,
        uber_transfer: transactionData.uber_transfer,
        total_outstanding: transactionData.total_outstanding,
        net_outstanding: transactionData.net_outstanding,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding hissab transaction:", error);
    throw error;
  }
};

// Add support ticket
export const addSupportTicket = async (ownerId, ticketData) => {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        tvp_owner_id: ownerId,
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        status: ticketData.status || "open",
        assigned_to: ticketData.assigned_to,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding support ticket:", error);
    throw error;
  }
};

// Update TVP owner profile
export const updateTVPOwnerProfile = async (ownerId, profileData) => {
  try {
    // Update user data
    const { error: userError } = await supabase
      .from("users")
      .update({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
      })
      .eq("id", ownerId);

    if (userError) throw userError;

    // Update or insert profile data
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("user_id", ownerId)
      .single();

    if (existingProfile) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          address: profileData.address,
          emergency_contact: profileData.emergencyContact,
          license_number: profileData.licenseNumber,
          region: profileData.region,
          status: profileData.status,
        })
        .eq("user_id", ownerId);

      if (profileError) throw profileError;
    } else {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: ownerId,
          address: profileData.address,
          emergency_contact: profileData.emergencyContact,
          license_number: profileData.licenseNumber,
          region: profileData.region,
          status: profileData.status,
        });

      if (profileError) throw profileError;
    }

    return true;
  } catch (error) {
    console.error("Error updating TVP owner profile:", error);
    throw error;
  }
};

// Get all vehicles (for vehicle management table)
export const getAllVehicles = async () => {
  try {
    // First, fetch all vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from("cars")
      .select("*")
      .order("created_at", { ascending: false });

    if (vehiclesError) throw vehiclesError;
    if (!vehicles || vehicles.length === 0) return [];

    // Get unique owner IDs
    const ownerIds = [
      ...new Set(vehicles.map((v) => v.tvp_owner_id).filter(Boolean)),
    ];
    
    if (ownerIds.length === 0) {
      return vehicles.map((v) => ({ ...v, users: null }));
    }

    // Fetch user data with profiles
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        user_profiles!user_id (
          full_name,
          phone
        )
      `
      )
      .in("id", ownerIds);

    if (usersError) {
      console.warn("Error fetching user data:", usersError);
      // Return vehicles without user data if fetch fails
      return vehicles.map((v) => ({ ...v, users: null }));
    }

    // Create a map of user data
    const userMap = {};
    (users || []).forEach((user) => {
      const profile = Array.isArray(user.user_profiles) 
        ? user.user_profiles[0] 
        : user.user_profiles;
      userMap[user.id] = {
        id: user.id,
        email: user.email,
        name: profile?.full_name || user.email,
      };
    });

    // Merge user data with vehicles
    return vehicles.map((vehicle) => ({
      ...vehicle,
      users: vehicle.tvp_owner_id
        ? userMap[vehicle.tvp_owner_id] || null
        : null,
    }));
  } catch (error) {
    console.error("Error fetching all vehicles:", error);
    throw error;
  }
};

// Get active vehicles only (for dropdowns/selection)
export const getActiveVehicles = async () => {
  try {
    const { data: vehicles, error } = await supabase
      .from("cars")
      .select("id, car_number, fleet_name")
      .eq("status", "active")
      .order("car_number", { ascending: true });

    if (error) throw error;
    return vehicles || [];
  } catch (error) {
    console.error("Error fetching active vehicles:", error);
    throw error;
  }
};

// Get vehicle statistics
export const getVehicleStatistics = async () => {
  try {
    const { data: vehicles, error } = await supabase
      .from("cars")
      .select("status");

    if (error) throw error;

    const stats = {
      total: vehicles?.length || 0,
      active: vehicles?.filter((v) => v.status === "active")?.length || 0,
      maintenance:
        vehicles?.filter((v) => v.status === "maintenance")?.length || 0,
      inactive: vehicles?.filter((v) => v.status === "inactive")?.length || 0,
    };

    return stats;
  } catch (error) {
    console.error("Error fetching vehicle statistics:", error);
    throw error;
  }
};

// ===== BILL / INVOICE MANAGEMENT =====

/** Get sum of unapplied accident_due for a driver and week (for bill preview / form) */
export const getAccidentPenaltyForWeek = async (driverId, weekStart, weekEnd) => {
  if (!driverId || !weekStart || !weekEnd) return 0;
  try {
    const { data: rows } = await supabase
      .from("tvp_driver_payments")
      .select("payment_amount")
      .eq("driver_id", driverId)
      .eq("payment_type", "accident_due")
      .is("applied_bill_id", null)
      .eq("week_start", weekStart)
      .eq("week_end", weekEnd);
    return (rows || []).reduce((sum, r) => sum + Number(r.payment_amount || 0), 0);
  } catch (e) {
    console.error("Error fetching accident penalty for week:", e);
    return 0;
  }
};

// Create a new bill/invoice for a driver
export const createDriverBill = async (billData) => {
  try {
    const billNumber = `INV-${Date.now()}-${billData.driverId
      .slice(-6)
      .toUpperCase()}`;

    // Fetch driver's pending penalty to apply to this bill
    const { data: driverRowForPenalty } = await supabase
      .from(DRIVER_TABLE)
      .select("penalty_amount")
      .eq("id", billData.driverId)
      .single();
    const driverPenalty = Number(driverRowForPenalty?.penalty_amount || 0);
    const baseCurrentOS = Number(billData.currentOS || 0);
    const penaltyToApply = Math.max(0, driverPenalty);

    // Fetch penalty_other (week-based "Other") for this driver and bill week; apply to bill
    let penaltyOtherSum = 0;
    let penaltyOtherRows = [];
    const weekStart = billData.weekStart || null;
    const weekEnd = billData.weekEnd || null;
    if (weekStart && weekEnd) {
      const { data: otherRows } = await supabase
        .from("tvp_driver_payments")
        .select("id, payment_amount")
        .eq("driver_id", billData.driverId)
        .eq("payment_type", "penalty_other")
        .is("applied_bill_id", null)
        .eq("week_start", weekStart)
        .eq("week_end", weekEnd);
      penaltyOtherRows = otherRows || [];
      penaltyOtherSum = penaltyOtherRows.reduce((sum, r) => sum + Number(r.payment_amount || 0), 0);
    }

    // Fetch accident_due (week-based accident penalty) for this driver and bill week
    let accidentPenaltySum = 0;
    let accidentDueRows = [];
    if (weekStart && weekEnd) {
      const { data: accidentRows } = await supabase
        .from("tvp_driver_payments")
        .select("id, payment_amount")
        .eq("driver_id", billData.driverId)
        .eq("payment_type", "accident_due")
        .is("applied_bill_id", null)
        .eq("week_start", weekStart)
        .eq("week_end", weekEnd);
      accidentDueRows = accidentRows || [];
      accidentPenaltySum = accidentDueRows.reduce((sum, r) => sum + Number(r.payment_amount || 0), 0);
    }

    const finalCurrentOS = baseCurrentOS + penaltyToApply + penaltyOtherSum + accidentPenaltySum;

    // Prepare vehicles breakdown array
    const vehiclesBreakdown = billData.vehicles ? billData.vehicles.map(v => ({
      vehicleNumber: v.vehicleNumber,
      rentalDays: Number(v.rentalDays) || 0,
      trips: Number(v.trips) || 0,
      dailyRent: Number(v.dailyRent) || 0,
      vehicleRent: (Number(v.dailyRent) || 0) * (Number(v.rentalDays) || 0),
    })) : [];

    // Insert the bill (current_os includes penalty; penalty_amount stored for invoice/audit)
    const { data: bill, error: billError } = await supabase
      .from("tvp_driver_bills")
      .insert({
        driver_id: billData.driverId,
        bill_number: billNumber,
        tvp_id: billData.tvpId,
        driver_name: billData.driverName,
        vehicle_number: billData.vehicleNumber,
        rental_days: billData.rentalDays,
        trips: billData.trips || 0,
        daily_rent: billData.dailyRent || 0,
        weekly_insurance: billData.weeklyInsurance || 210,
        double_driver_charge: billData.doubleDriverCharge || 0,
        net_weekly_rent: billData.netWeeklyRent || 0,
        total_earnings: billData.totalEarnings || 0,
        total_cash_collect: billData.totalCashCollect || 0,
        difference: billData.difference || 0,
        platform_fee: billData.platformFee || 0,
        toll: billData.toll || 0,
        tds: billData.tds || 0,
        vehicle_adjustment: billData.vehicleAdjustment || 0,
        rto_fine: billData.rtoFine || 0,
        accident: billData.accident || 0,
        dead_km: billData.deadKm || 0,
        room_rent: billData.roomRent || 0,
        penalty_amount: penaltyToApply,
        penalty_other_amount: penaltyOtherSum,
        accident_penalty_amount: accidentPenaltySum,
        current_os: finalCurrentOS,
        week_start: billData.weekStart || null,
        week_end: billData.weekEnd || null,
        vehicles_breakdown: vehiclesBreakdown.length > 0 ? vehiclesBreakdown : null,
        invoice_html: billData.invoiceHtml || null,
        status: "generated",
      })
      .select()
      .single();

    if (billError) throw billError;

    // Regenerate invoice HTML with final amount (including penalty) so stored invoice is correct
    const invoicePayload = {
      ...billData,
      currentOS: finalCurrentOS,
      penaltyAmount: penaltyToApply,
      penaltyOtherAmount: penaltyOtherSum,
      accidentPenaltyAmount: accidentPenaltySum,
      billNumber: bill.bill_number,
    };
    const correctInvoiceHtml = generateInvoiceHTML(invoicePayload);
    const { data: updatedBill, error: updateInvError } = await supabase
      .from("tvp_driver_bills")
      .update({ invoice_html: correctInvoiceHtml })
      .eq("id", bill.id)
      .select()
      .single();
    if (!updateInvError && updatedBill) {
      Object.assign(bill, updatedBill);
    }

    // Accumulate rental days: add new rental days to cumulative_rental_days
    const rentalDaysToAdd = Number(billData.rentalDays || 0);
    if (rentalDaysToAdd > 0) {
      // Get current cumulative rental days
      const { data: driverRow } = await supabase
        .from(DRIVER_TABLE)
        .select("cumulative_rental_days")
        .eq("id", billData.driverId)
        .single();

      const currentCumulative = Number(driverRow?.cumulative_rental_days || 0);
      const newCumulative = currentCumulative + rentalDaysToAdd;

      // Update cumulative rental days
      const { error: updateError } = await supabase
        .from(DRIVER_TABLE)
        .update({ cumulative_rental_days: newCumulative })
        .eq("id", billData.driverId);

      if (updateError) {
        console.error("Error updating cumulative rental days:", updateError);
        // Don't throw, bill was created successfully
      }
    }

    // Update outstanding balance with the final amount (current_os, includes penalty)
    const finalAmount = finalCurrentOS;
    if (finalAmount !== 0) {
      const { data: driverRow } = await supabase
        .from(DRIVER_TABLE)
        .select("outstanding_balance")
        .eq("id", billData.driverId)
        .single();

      const currentOutstanding = Number(driverRow?.outstanding_balance || 0);
      const newOutstanding = currentOutstanding + finalAmount;

      const { error: balanceError } = await supabase
        .from(DRIVER_TABLE)
        .update({ outstanding_balance: newOutstanding })
        .eq("id", billData.driverId);

      if (balanceError) {
        console.error("Error updating outstanding balance:", balanceError);
        // Don't throw, bill was created successfully
      }
    }

    // Reduce driver's pending penalty by the amount applied to this bill
    if (penaltyToApply > 0) {
      const newDriverPenalty = Math.max(0, driverPenalty - penaltyToApply);
      await supabase
        .from(DRIVER_TABLE)
        .update({ penalty_amount: newDriverPenalty })
        .eq("id", billData.driverId);
    }

    // Reduce driver penalty_amount by accident penalty applied (accident_due for this week)
    if (accidentPenaltySum > 0) {
      const { data: driverPenaltyRow } = await supabase
        .from(DRIVER_TABLE)
        .select("penalty_amount")
        .eq("id", billData.driverId)
        .single();
      const currentPenalty = Number(driverPenaltyRow?.penalty_amount || 0);
      const newPenalty = Math.max(0, currentPenalty - accidentPenaltySum);
      await supabase
        .from(DRIVER_TABLE)
        .update({ penalty_amount: newPenalty })
        .eq("id", billData.driverId);
    }

    // Mark accident_due rows as applied and add accident_paid so ledger shows "paid"
    if (accidentDueRows.length > 0 && bill?.id) {
      await supabase
        .from("tvp_driver_payments")
        .update({ applied_bill_id: bill.id })
        .in("id", accidentDueRows.map((r) => r.id));
      if (accidentPenaltySum > 0) {
        await createDriverPayment({
          driverId: billData.driverId,
          paymentType: "accident_paid",
          account: "letzryd",
          paymentAmount: accidentPenaltySum,
          paymentDate: weekEnd || new Date().toISOString().split("T")[0],
          weekStart: weekStart || undefined,
          weekEnd: weekEnd || undefined,
          notes: "Auto: Accident penalty applied to bill",
        });
      }
    }

    // Mark penalty_other rows as applied and add penalty_paid so ledger shows "paid"
    if (penaltyOtherRows.length > 0 && bill?.id) {
      await supabase
        .from("tvp_driver_payments")
        .update({ applied_bill_id: bill.id })
        .in("id", penaltyOtherRows.map((r) => r.id));
      if (penaltyOtherSum > 0) {
        await createDriverPayment({
          driverId: billData.driverId,
          paymentType: "penalty_paid",
          account: "letzryd",
          paymentAmount: penaltyOtherSum,
          paymentDate: weekEnd || new Date().toISOString().split("T")[0],
          weekStart: weekStart || undefined,
          weekEnd: weekEnd || undefined,
          notes: "Auto: Other (week-based) applied to bill",
        });
      }
    }

    // Insert "bill" ledger entry in tvp_driver_payments for week-based balance tracking
    const billAmount = finalCurrentOS;
    if (billAmount !== 0 && weekStart && weekEnd && bill?.id) {
      const { error: paymentError } = await supabase
        .from("tvp_driver_payments")
        .insert({
          driver_id: billData.driverId,
          bill_id: bill.id,
          payment_amount: billAmount,
          payment_date: weekEnd,
          payment_type: "bill",
          week_start: weekStart,
          week_end: weekEnd,
        });
      if (paymentError) {
        console.error("Error inserting bill ledger entry:", paymentError);
        // Don't throw, bill was created successfully
      }
    }

    return bill;
  } catch (error) {
    console.error("Error creating driver bill:", error);
    throw error;
  }
};

// Get all bills for a driver
export const getDriverBills = async (driverId) => {
  try {
    const { data, error } = await supabase
      .from("tvp_driver_bills")
      .select("*, vehicles_breakdown")
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching driver bills:", error);
    throw error;
  }
};

// Get a single bill by ID
export const getBillById = async (billId) => {
  try {
    const { data, error } = await supabase
      .from("tvp_driver_bills")
      .select("*")
      .eq("id", billId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching bill:", error);
    throw error;
  }
};

// Delete a bill
export const deleteDriverBill = async (billId, driverId) => {
  try {
    // Get bill details before deleting
    const { data: bill } = await supabase
      .from("tvp_driver_bills")
      .select("current_os, rental_days")
      .eq("id", billId)
      .single();

    // Delete the corresponding bill ledger entry in tvp_driver_payments
    await supabase
      .from("tvp_driver_payments")
      .delete()
      .eq("bill_id", billId)
      .eq("payment_type", "bill");

    // Delete the bill
    const { error } = await supabase
      .from("tvp_driver_bills")
      .delete()
      .eq("id", billId);

    if (error) throw error;

    // Update outstanding balance: subtract the bill amount
    if (bill) {
      const { data: driverRow } = await supabase
        .from(DRIVER_TABLE)
        .select("outstanding_balance, cumulative_rental_days")
        .eq("id", driverId)
        .single();

      if (driverRow) {
        const currentOutstanding = Number(driverRow.outstanding_balance || 0);
        const billAmount = Number(bill.current_os || 0);
        const newOutstanding = Math.max(0, currentOutstanding - billAmount);

        // Update outstanding balance
        const { error: balanceError } = await supabase
          .from(DRIVER_TABLE)
          .update({ outstanding_balance: newOutstanding })
          .eq("id", driverId);

        if (balanceError) {
          console.error("Error updating outstanding balance:", balanceError);
          // Don't throw, bill was deleted successfully
        }

        // Update cumulative rental days: subtract the rental days from the bill
        const rentalDaysToSubtract = Number(bill.rental_days || 0);
        if (rentalDaysToSubtract > 0) {
          const currentCumulative = Number(
            driverRow.cumulative_rental_days || 0
          );
          const newCumulative = Math.max(
            0,
            currentCumulative - rentalDaysToSubtract
          );

          const { error: rentalDaysError } = await supabase
            .from(DRIVER_TABLE)
            .update({ cumulative_rental_days: newCumulative })
            .eq("id", driverId);

          if (rentalDaysError) {
            console.error(
              "Error updating cumulative rental days:",
              rentalDaysError
            );
            // Don't throw, bill was deleted successfully
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error("Error deleting driver bill:", error);
    throw error;
  }
};

// ===== PAYMENT MANAGEMENT =====

// Get all payments for a driver
export const getDriverPayments = async (driverId) => {
  try {
    const { data, error } = await supabase
      .from("tvp_driver_payments")
      .select("*")
      .eq("driver_id", driverId)
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching driver payments:", error);
    throw error;
  }
};

// Create a payment for a driver
export const createDriverPayment = async (paymentData) => {
  try {
    if (!paymentData?.driverId) {
      throw new Error("Driver ID is required");
    }
    const amount = Number(paymentData.paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Valid payment amount is required");
    }
    const paymentType = paymentData.paymentType || "penalty_paid";
    const validTypes = [
      "paid", "due", "refund", "deposit", "deposit_due",
      "deposit_refund", "deposit_paid", "penalty_due", "penalty_refund", "penalty_paid", "penalty_other",
      "accident_due", "accident_paid",
    ];
    if (!validTypes.includes(paymentType)) {
      throw new Error(`Invalid payment type: ${paymentType}`);
    }
    if (paymentType === "penalty_other" || paymentType === "accident_due") {
      if (!paymentData.weekStart || !paymentData.weekEnd) {
        throw new Error("Week start and week end are required for this transaction type");
      }
    }
    const requiresAccount = ["paid", "refund", "deposit_due", "deposit_refund", "deposit_paid", "penalty_due", "penalty_refund", "penalty_paid", "accident_paid"];
    if (requiresAccount.includes(paymentType) && !paymentData.account) {
      throw new Error("Account is required for this transaction type");
    }

    // Upload screenshot if provided
    let screenshotUrl = null;
    if (paymentData.screenshot) {
      const cleanedName =
        paymentData.screenshot.name?.replace(/\s+/g, "_").toLowerCase() ||
        "screenshot";
      const path = `${
        paymentData.driverId
      }/payment_screenshots/${Date.now()}-${cleanedName}`;

      const { error: uploadError } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .upload(path, paymentData.screenshot, { upsert: true });

      if (uploadError) {
        console.error("Screenshot upload error:", uploadError);
        // Don't throw, continue without screenshot
      } else {
        const { data: urlData } = supabase.storage
          .from(DOCUMENT_BUCKET)
          .getPublicUrl(path);
        screenshotUrl = urlData?.publicUrl || null;
      }
    }

    const paymentDate =
      paymentData.paymentDate || new Date().toISOString().split("T")[0];
    const { weekStart, weekEnd } =
      (paymentType === "penalty_other" || paymentType === "accident_due") && paymentData.weekStart && paymentData.weekEnd
        ? { weekStart: paymentData.weekStart, weekEnd: paymentData.weekEnd }
        : paymentData.weekStart && paymentData.weekEnd
        ? { weekStart: paymentData.weekStart, weekEnd: paymentData.weekEnd }
        : getWeekFromDate(paymentDate);

    const insertPayload = {
      driver_id: paymentData.driverId,
      bill_id: paymentData.billId || null,
      payment_amount: paymentData.paymentAmount,
      payment_date: paymentDate,
      payment_type: paymentData.paymentType || "paid",
      payment_method: paymentData.paymentMethod || null,
      reference_number: paymentData.referenceNumber || null,
      notes: paymentData.notes || null,
      screenshot_url: screenshotUrl,
      account: (["paid", "refund", "deposit_due", "deposit_refund", "deposit_paid", "penalty_due", "penalty_refund", "penalty_paid", "accident_paid"].includes(paymentData.paymentType))
        ? (paymentData.account || "letzryd") : null,
      ...(weekStart && weekEnd && { week_start: weekStart, week_end: weekEnd }),
    };

    let { data, error } = await supabase
      .from("tvp_driver_payments")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      const isAccountSchemaError =
        (error?.code === "PGRST204" || error?.message?.includes("schema cache")) &&
        (error?.message?.includes("account") || false);
      if (isAccountSchemaError) {
        const { account: _a, ...rest } = insertPayload;
        const retry = await supabase
          .from("tvp_driver_payments")
          .insert(rest)
          .select()
          .single();
        if (retry.error) throw retry.error;
        data = retry.data;
      } else {
        throw error;
      }
    }

    // Update balance based on payment type
    // Deposit ledger: deposit, deposit_refund, deposit_paid (+) | deposit_due (-)
    // Penalty ledger: bill, due, penalty_due (+) | paid, refund, penalty_refund, penalty_paid (-)
    const { data: driverRow } = await supabase
      .from(DRIVER_TABLE)
      .select("outstanding_balance, deposit_amount")
      .eq("id", paymentData.driverId)
      .single();

    if (driverRow) {
      const paymentAmount = Number(paymentData.paymentAmount || 0);
      const paymentType = paymentData.paymentType || "penalty_paid";

      // penalty_other: pending charge for a specific week; do not update balance (applied when bill is generated)
      if (paymentType === "penalty_other") {
        return data;
      }

      // accident_due: week-based accident penalty; do not update outstanding; add to driver penalty_amount
      if (paymentType === "accident_due") {
        const { data: driverPenaltyRow } = await supabase
          .from(DRIVER_TABLE)
          .select("penalty_amount")
          .eq("id", paymentData.driverId)
          .single();
        const currentPenalty = Number(driverPenaltyRow?.penalty_amount || 0);
        const newPenalty = currentPenalty + paymentAmount;
        const { error: penaltyError } = await supabase
          .from(DRIVER_TABLE)
          .update({ penalty_amount: newPenalty })
          .eq("id", paymentData.driverId);
        if (penaltyError) {
          console.error("Error updating driver penalty_amount:", penaltyError);
          throw new Error(`Payment saved but failed to update penalty amount: ${penaltyError.message}`);
        }
        return data;
      }

      const depositAdds = ["deposit", "deposit_refund", "deposit_paid"];
      const depositReduces = ["deposit_due"];
      const penaltyAdds = ["bill", "due", "penalty_due"];
      const penaltyReduces = ["paid", "refund", "penalty_refund", "penalty_paid", "accident_paid"];

      if (depositAdds.includes(paymentType)) {
        const currentDeposit = Number(driverRow.deposit_amount || 0);
        const newDeposit = currentDeposit + paymentAmount;
        const { error: depositError } = await supabase
          .from(DRIVER_TABLE)
          .update({ deposit_amount: newDeposit })
          .eq("id", paymentData.driverId);
        if (depositError) {
          console.error("Error updating deposit amount:", depositError);
          throw new Error(`Payment saved but failed to update deposit: ${depositError.message}`);
        }
      } else if (depositReduces.includes(paymentType)) {
        const currentDeposit = Number(driverRow.deposit_amount || 0);
        const newDeposit = Math.max(0, currentDeposit - paymentAmount);
        const { error: depositError } = await supabase
          .from(DRIVER_TABLE)
          .update({ deposit_amount: newDeposit })
          .eq("id", paymentData.driverId);
        if (depositError) {
          console.error("Error updating deposit amount:", depositError);
          throw new Error(`Payment saved but failed to update deposit: ${depositError.message}`);
        }
      } else if (penaltyAdds.includes(paymentType)) {
        const currentOutstanding = Number(driverRow.outstanding_balance || 0);
        const newOutstanding = currentOutstanding + paymentAmount;
        const { error: balanceError } = await supabase
          .from(DRIVER_TABLE)
          .update({ outstanding_balance: newOutstanding })
          .eq("id", paymentData.driverId);
        if (balanceError) {
          console.error("Error updating outstanding balance:", balanceError);
          throw new Error(`Payment saved but failed to update outstanding: ${balanceError.message}`);
        }
      } else if (penaltyReduces.includes(paymentType)) {
        const currentOutstanding = Number(driverRow.outstanding_balance || 0);
        const newOutstanding = currentOutstanding - paymentAmount;
        const { error: balanceError } = await supabase
          .from(DRIVER_TABLE)
          .update({ outstanding_balance: newOutstanding })
          .eq("id", paymentData.driverId);
        if (balanceError) {
          console.error("Error updating outstanding balance:", balanceError);
          throw new Error(`Payment saved but failed to update outstanding: ${balanceError.message}`);
        }
      }
    }

    return data;
  } catch (error) {
    console.error("Error creating driver payment:", error);
    throw error;
  }
};

// Update a payment
export const updateDriverPayment = async (paymentId, driverId, paymentData) => {
  try {
    if (!paymentId || !driverId) {
      throw new Error("Payment ID and Driver ID are required");
    }
    const amount = Number(paymentData.paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Valid payment amount is required");
    }

    const { data: existing } = await supabase
      .from("tvp_driver_payments")
      .select("payment_amount, payment_type")
      .eq("id", paymentId)
      .single();

    if (!existing) throw new Error("Payment not found");

    let screenshotUrl = undefined;
    if (paymentData.screenshot) {
      const cleanedName =
        paymentData.screenshot.name?.replace(/\s+/g, "_").toLowerCase() ||
        "screenshot";
      const path = `${driverId}/payment_screenshots/${Date.now()}-${cleanedName}`;
      const { error: uploadError } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .upload(path, paymentData.screenshot, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from(DOCUMENT_BUCKET)
          .getPublicUrl(path);
        screenshotUrl = urlData?.publicUrl || null;
      }
    }

    const paymentDate = paymentData.paymentDate || existing.payment_date;
    const { weekStart, weekEnd } =
      paymentData.weekStart && paymentData.weekEnd
        ? { weekStart: paymentData.weekStart, weekEnd: paymentData.weekEnd }
        : getWeekFromDate(paymentDate);

    const updatePayload = {
      payment_amount: paymentData.paymentAmount,
      payment_date: paymentDate,
      payment_type: paymentData.paymentType || "paid",
      payment_method: paymentData.paymentMethod ?? null,
      reference_number: paymentData.referenceNumber ?? null,
      notes: paymentData.notes ?? null,
    };
    const accountTypes = ["paid", "refund", "deposit_due", "deposit_refund", "deposit_paid", "penalty_due", "penalty_refund", "penalty_paid", "accident_paid"];
    updatePayload.account = accountTypes.includes(paymentData.paymentType)
      ? (paymentData.account ?? "letzryd")
      : null;
    if (screenshotUrl != null) updatePayload.screenshot_url = screenshotUrl;
    if (weekStart && weekEnd) {
      updatePayload.week_start = weekStart;
      updatePayload.week_end = weekEnd;
    }

    const { data: updated, error } = await supabase
      .from("tvp_driver_payments")
      .update(updatePayload)
      .eq("id", paymentId)
      .select()
      .single();

    if (error) throw error;

    const oldAmount = Number(existing.payment_amount || 0);
    const oldType = existing.payment_type || "paid";
    const newAmount = Number(paymentData.paymentAmount || 0);
    const newType = paymentData.paymentType || "paid";

    const depositAdds = ["deposit", "deposit_refund", "deposit_paid"];
    const depositReduces = ["deposit_due"];
    const penaltyAdds = ["bill", "due", "penalty_due"];
    const penaltyReduces = ["paid", "refund", "penalty_refund", "penalty_paid", "accident_paid"];

    const { data: driverRow } = await supabase
      .from(DRIVER_TABLE)
      .select("outstanding_balance, deposit_amount, penalty_amount")
      .eq("id", driverId)
      .single();

    if (driverRow) {
      const currentOutstanding = Number(driverRow.outstanding_balance || 0);
      const currentDeposit = Number(driverRow.deposit_amount || 0);
      let currentPenalty = Number(driverRow.penalty_amount || 0);

      let newOutstanding = currentOutstanding;
      let newDeposit = currentDeposit;
      let newPenalty = currentPenalty;

      // Reverse old payment effect
      if (depositAdds.includes(oldType)) {
        newDeposit = Math.max(0, newDeposit - oldAmount);
      } else if (depositReduces.includes(oldType)) {
        newDeposit = newDeposit + oldAmount;
      } else if (penaltyAdds.includes(oldType)) {
        newOutstanding = Math.max(0, newOutstanding - oldAmount);
      } else if (penaltyReduces.includes(oldType)) {
        newOutstanding = newOutstanding + oldAmount;
      } else if (oldType === "accident_due") {
        newPenalty = Math.max(0, newPenalty - oldAmount);
      }

      // Apply new payment effect
      if (depositAdds.includes(newType)) {
        newDeposit = newDeposit + newAmount;
      } else if (depositReduces.includes(newType)) {
        newDeposit = Math.max(0, newDeposit - newAmount);
      } else if (penaltyAdds.includes(newType)) {
        newOutstanding = newOutstanding + newAmount;
      } else if (penaltyReduces.includes(newType)) {
        newOutstanding = newOutstanding - newAmount;
      } else if (newType === "accident_due") {
        newPenalty = newPenalty + newAmount;
      }

      const updatePayload = { outstanding_balance: newOutstanding, deposit_amount: newDeposit };
      if (oldType === "accident_due" || newType === "accident_due") {
        updatePayload.penalty_amount = newPenalty;
      }

      const { error: balanceError } = await supabase
        .from(DRIVER_TABLE)
        .update(updatePayload)
        .eq("id", driverId);

      if (balanceError) {
        console.error("Error updating balance:", balanceError);
        throw new Error(`Payment updated but failed to sync balance: ${balanceError.message}`);
      }
    }

    return updated;
  } catch (error) {
    console.error("Error updating driver payment:", error);
    throw error;
  }
};

// Delete a payment
export const deleteDriverPayment = async (paymentId, driverId) => {
  try {
    if (!paymentId) {
      throw new Error("Payment ID is required");
    }

    const { data: payment, error: fetchError } = await supabase
      .from("tvp_driver_payments")
      .select("payment_amount, payment_type, driver_id")
      .eq("id", paymentId)
      .single();

    if (fetchError || !payment) {
      throw new Error(
        fetchError?.message || "Payment not found. It may have been already deleted."
      );
    }

    const targetDriverId = payment.driver_id || driverId;
    if (!targetDriverId) {
      throw new Error("Cannot determine driver for this payment");
    }

    const paymentAmount = Number(payment.payment_amount || 0);
    const paymentType = payment.payment_type || "paid";

    const penaltyAdds = ["bill", "due", "penalty_due"];
    const penaltyReduces = ["paid", "refund", "penalty_refund", "penalty_paid", "accident_paid"];

    const { data: driverRow, error: driverError } = await supabase
      .from(DRIVER_TABLE)
      .select("outstanding_balance, deposit_amount, penalty_amount")
      .eq("id", targetDriverId)
      .single();

    if (driverError || !driverRow) {
      throw new Error("Driver not found. Cannot restore balance.");
    }

    const currentOutstanding = Number(driverRow.outstanding_balance || 0);
    const currentDeposit = Number(driverRow.deposit_amount || 0);
    const currentPenalty = Number(driverRow.penalty_amount || 0);

    const depositAdds = ["deposit", "deposit_refund", "deposit_paid"];
    const depositReduces = ["deposit_due"];

    const updateData = {};
    if (depositAdds.includes(paymentType)) {
      updateData.deposit_amount = Math.max(0, currentDeposit - paymentAmount);
    } else if (depositReduces.includes(paymentType)) {
      updateData.deposit_amount = currentDeposit + paymentAmount;
    } else if (penaltyAdds.includes(paymentType)) {
      updateData.outstanding_balance = Math.max(0, currentOutstanding - paymentAmount);
    } else if (penaltyReduces.includes(paymentType)) {
      updateData.outstanding_balance = currentOutstanding + paymentAmount;
    } else if (paymentType === "accident_due") {
      updateData.penalty_amount = Math.max(0, currentPenalty - paymentAmount);
    }

    const { error: balanceError } = await supabase
      .from(DRIVER_TABLE)
      .update(updateData)
      .eq("id", targetDriverId);

    if (balanceError) {
      console.error("Error restoring balance before delete:", balanceError);
      throw new Error(
        `Failed to restore balance: ${balanceError.message}. Payment was not deleted.`
      );
    }

    const { error: deleteError } = await supabase
      .from("tvp_driver_payments")
      .delete()
      .eq("id", paymentId);

    if (deleteError) {
      console.error("Error deleting payment after balance restore:", deleteError);
      throw new Error(
        `Balance was restored but failed to delete payment: ${deleteError.message}. Please refresh and try again.`
      );
    }

    return {
      success: true,
      outstandingBalance: updateData.outstanding_balance ?? currentOutstanding,
      depositAmount: updateData.deposit_amount ?? currentDeposit,
    };
  } catch (error) {
    console.error("Error deleting driver payment:", error);
    throw error;
  }
};

// Get total outstanding balance (sum of all bill amounts - sum of all payments)
export const getTotalOutstandingBalance = async (driverId) => {
  try {
    // Get sum of all bill final amounts (current_os)
    const { data: bills } = await supabase
      .from("tvp_driver_bills")
      .select("current_os")
      .eq("driver_id", driverId);

    const totalBillAmount = (bills || []).reduce((sum, bill) => {
      return sum + Number(bill.current_os || 0);
    }, 0);

    // Get sum of all payments
    const { data: payments } = await supabase
      .from("tvp_driver_payments")
      .select("payment_amount")
      .eq("driver_id", driverId);

    const totalPayments = (payments || []).reduce((sum, payment) => {
      return sum + Number(payment.payment_amount || 0);
    }, 0);

    return totalBillAmount - totalPayments;
  } catch (error) {
    console.error("Error calculating total outstanding balance:", error);
    throw error;
  }
};

// Get bill summary statistics for all drivers
// Optional { dateFrom, dateTo }: when provided, returns week-based balance from payments ledger
// liveOutstanding = sum of drivers' outstanding_balance (all-time)
// weekBalanceToCollect = (bills for week) - (payments for week) when date range is provided
export const getBillSummaryStatistics = async (opts = {}) => {
  try {
    const { dateFrom, dateTo } = opts;

    // Always fetch live outstanding (sum of outstanding_balance) - used when no week selected
    const { data: drivers, error: driversError } = await supabase
      .from(DRIVER_TABLE)
      .select("outstanding_balance");

    if (driversError) throw driversError;

    const liveOutstanding = (drivers || []).reduce((sum, driver) => {
      return sum + Number(driver.outstanding_balance || 0);
    }, 0);

    if (dateFrom && dateTo) {
      // Bills for week: from tvp_driver_bills (source of truth)
      const { data: bills, error } = await supabase
        .from("tvp_driver_bills")
        .select("current_os")
        .not("week_start", "is", null)
        .not("week_end", "is", null)
        .lte("week_start", dateTo)
        .gte("week_end", dateFrom);

      if (error) throw error;

      const totalOutstandingAmount = (bills || []).reduce((sum, b) => {
        return sum + Number(b.current_os || 0);
      }, 0);

      // Payments for week: paid/due/refund from tvp_driver_payments
      const { data: payments, error: paymentsError } = await supabase
        .from("tvp_driver_payments")
        .select("payment_type, payment_amount, week_start, week_end, payment_date");

      if (paymentsError) throw paymentsError;

      const overlapsWeek = (row) => {
        if (row?.week_start && row?.week_end) {
          return row.week_start <= dateTo && row.week_end >= dateFrom;
        }
        return row?.payment_date >= dateFrom && row?.payment_date <= dateTo;
      };

      let paymentsSum = 0;
      let dueSum = 0;
      (payments || []).forEach((row) => {
        if (!overlapsWeek(row)) return;
        const amt = Number(row?.payment_amount || 0);
        if (["paid", "refund", "penalty_refund", "penalty_paid"].includes(row?.payment_type)) {
          paymentsSum += amt;
        } else if (["due", "penalty_due"].includes(row?.payment_type)) {
          dueSum += amt;
        }
      });

      // Balance to collect = bills for week - due (reduces) - paid/refund (reduces)
      const weekBalanceToCollect = Math.max(0, totalOutstandingAmount - dueSum - paymentsSum);
      const totalOutstandingForWeek = Math.max(0, totalOutstandingAmount - dueSum);

      return {
        totalOutstandingAmount,
        totalOutstandingForWeek,
        liveOutstanding,
        weekBalanceToCollect,
      };
    }

    return { totalOutstandingAmount: liveOutstanding, liveOutstanding, weekBalanceToCollect: null, totalOutstandingForWeek: null };
  } catch (error) {
    console.error("Error getting bill summary statistics:", error);
    throw error;
  }
};

// Total amount collected per account (paid payments only), across all drivers
// Only counts payments where account was explicitly selected (LetzRyd, Tawaaq Fleet, Cash In hand)
// Optional { dateFrom, dateTo }: filter by payment_date (selected week) - only payments in that week are shown
export const getPaymentsSummaryByAccount = async (opts = {}) => {
  try {
    const { dateFrom, dateTo } = opts;
    let q = supabase
      .from("tvp_driver_payments")
      .select("account, payment_amount")
      .in("payment_type", ["paid", "penalty_paid"]);

    if (dateFrom) q = q.gte("payment_date", dateFrom);
    if (dateTo) q = q.lte("payment_date", dateTo);

    const { data, error } = await q;

    if (error) throw error;

    const totals = { letzryd: 0, tawaaq_fleet: 0, cash_in_hand: 0 };
    (data || []).forEach((row) => {
      // Only count payments where account was explicitly selected as one of our three
      const k = row?.account;
      if (k && totals[k] !== undefined) {
        totals[k] += Number(row?.payment_amount) || 0;
      }
    });
    return totals;
  } catch (error) {
    console.error("Error getting payments summary by account:", error);
    return { letzryd: 0, tawaaq_fleet: 0, cash_in_hand: 0 };
  }
};

// Deposit summary: total deposit across drivers + deposit/deposit_due in period
// Optional { dateFrom, dateTo }: filter payments by week overlap
export const getDepositSummary = async (opts = {}) => {
  try {
    const { dateFrom, dateTo } = opts;

    // Total deposit across all drivers (live)
    const { data: drivers, error: driversError } = await supabase
      .from(DRIVER_TABLE)
      .select("deposit_amount");

    if (driversError) throw driversError;

    const totalDeposit = (drivers || []).reduce((sum, d) => {
      return sum + Number(d?.deposit_amount || 0);
    }, 0);

    if (!dateFrom || !dateTo) {
      return { totalDeposit, depositInPeriod: 0, depositDueInPeriod: 0 };
    }

    const { data: payments, error: paymentsError } = await supabase
      .from("tvp_driver_payments")
      .select("payment_type, payment_amount, week_start, week_end, payment_date");

    if (paymentsError) throw paymentsError;

    const overlapsWeek = (row) => {
      if (row?.week_start && row?.week_end) {
        return row.week_start <= dateTo && row.week_end >= dateFrom;
      }
      return row?.payment_date >= dateFrom && row?.payment_date <= dateTo;
    };

    let depositInPeriod = 0;
    let depositDueInPeriod = 0;
    (payments || []).forEach((row) => {
      if (!overlapsWeek(row)) return;
      const amt = Number(row?.payment_amount || 0);
      if (["deposit", "deposit_due"].includes(row?.payment_type)) depositInPeriod += amt;
      else if (["deposit_refund", "deposit_paid"].includes(row?.payment_type)) depositDueInPeriod += amt;
    });

    return { totalDeposit, depositInPeriod, depositDueInPeriod };
  } catch (error) {
    console.error("Error getting deposit summary:", error);
    throw error;
  }
};

// Create multi-vehicle bill (for Hissab Generator)
export const createMultiVehicleBill = async (hissabData) => {
  try {
    const { owner, week, vehicles, otherCharges, totals } = hissabData;

    // Fetch owner's pending penalty to apply to this bill
    const { data: driverRowForPenalty } = await supabase
      .from(DRIVER_TABLE)
      .select("penalty_amount")
      .eq("id", owner.id)
      .single();
    const driverPenalty = Number(driverRowForPenalty?.penalty_amount || 0);
    const penaltyToApply = Math.max(0, driverPenalty);

    // Fetch penalty_other for this owner and bill week
    let penaltyOtherSum = 0;
    let penaltyOtherRows = [];
    const weekStart = week?.weekStart || null;
    const weekEnd = week?.weekEnd || null;
    if (weekStart && weekEnd) {
      const { data: otherRows } = await supabase
        .from("tvp_driver_payments")
        .select("id, payment_amount")
        .eq("driver_id", owner.id)
        .eq("payment_type", "penalty_other")
        .is("applied_bill_id", null)
        .eq("week_start", weekStart)
        .eq("week_end", weekEnd);
      penaltyOtherRows = otherRows || [];
      penaltyOtherSum = penaltyOtherRows.reduce((sum, r) => sum + Number(r.payment_amount || 0), 0);
    }

    const finalAmountWithPenalty = Number(totals.finalAmount || 0) + penaltyToApply + penaltyOtherSum;

    // Build hissab data with final amount including penalty for invoice
    const hissabDataForInvoice = {
      ...hissabData,
      totals: {
        ...totals,
        finalAmount: finalAmountWithPenalty,
        penaltyAmount: penaltyToApply,
        penaltyOtherAmount: penaltyOtherSum,
      },
    };

    // Create a main bill record with combined totals
    const billNumber = `HISSAB-${Date.now()}-${owner.id
      .slice(-6)
      .toUpperCase()}`;

    // Generate invoice HTML for multi-vehicle bill (includes penalty if any)
    const invoiceHtml = generateMultiVehicleInvoiceHTML(hissabDataForInvoice);

    // Create main bill record
    const mainBillData = {
      driver_id: owner.id,
      bill_number: billNumber,
      tvp_id: owner.tvpId || "",
      driver_name: owner.name || "",
      vehicle_number: vehicles
        .map((v) => v.vehicle?.car_number)
        .filter(Boolean)
        .join(", "),
      rental_days: vehicles.reduce(
        (sum, v) => sum + (v.billData.rentalDays || 0),
        0
      ),
      trips: vehicles.reduce((sum, v) => sum + (v.billData.trips || 0), 0),
      daily_rent:
        totals.totalNetRent /
        (vehicles.reduce((sum, v) => sum + (v.billData.rentalDays || 0), 0) ||
          1),
      weekly_insurance: vehicles.reduce(
        (sum, v) => sum + (v.billData.weeklyInsurance || 0),
        0
      ),
      double_driver_charge: vehicles.reduce(
        (sum, v) => sum + (v.billData.doubleDriverCharge || 0),
        0
      ),
      net_weekly_rent: totals.totalNetRent,
      total_earnings: vehicles.reduce(
        (sum, v) => sum + (v.billData.totalEarnings || 0),
        0
      ),
      total_cash_collect: vehicles.reduce(
        (sum, v) => sum + (v.billData.totalCashCollect || 0),
        0
      ),
      difference: vehicles.reduce(
        (sum, v) => sum + (v.billData.difference || 0),
        0
      ),
      platform_fee: vehicles.reduce(
        (sum, v) => sum + (v.billData.platformFee || 0),
        0
      ),
      toll: vehicles.reduce((sum, v) => sum + (v.billData.toll || 0), 0),
      tds: vehicles.reduce((sum, v) => sum + (v.billData.tds || 0), 0),
      vehicle_adjustment: vehicles.reduce(
        (sum, v) => sum + (v.billData.vehicleAdjustment || 0),
        0
      ),
      rto_fine: vehicles.reduce((sum, v) => sum + (v.billData.rtoFine || 0), 0),
      accident: vehicles.reduce(
        (sum, v) => sum + (v.billData.accident || 0),
        0
      ),
      dead_km: vehicles.reduce((sum, v) => sum + (v.billData.deadKm || 0), 0),
      penalty_amount: penaltyToApply,
      penalty_other_amount: penaltyOtherSum,
      current_os: finalAmountWithPenalty,
      week_start: week?.weekStart || null,
      week_end: week?.weekEnd || null,
      invoice_html: invoiceHtml,
      status: "generated",
    };

    const { data: bill, error } = await supabase
      .from("tvp_driver_bills")
      .insert(mainBillData)
      .select()
      .single();

    if (error) throw error;

    // Reduce driver's pending penalty by the amount applied to this bill
    if (penaltyToApply > 0 && owner?.id) {
      const newDriverPenalty = Math.max(0, driverPenalty - penaltyToApply);
      await supabase
        .from(DRIVER_TABLE)
        .update({ penalty_amount: newDriverPenalty })
        .eq("id", owner.id);
    }

    // Mark penalty_other as applied and add penalty_paid
    if (penaltyOtherRows.length > 0 && bill?.id) {
      await supabase
        .from("tvp_driver_payments")
        .update({ applied_bill_id: bill.id })
        .in("id", penaltyOtherRows.map((r) => r.id));
      if (penaltyOtherSum > 0 && owner?.id) {
        await createDriverPayment({
          driverId: owner.id,
          paymentType: "penalty_paid",
          account: "letzryd",
          paymentAmount: penaltyOtherSum,
          paymentDate: weekEnd || new Date().toISOString().split("T")[0],
          weekStart: weekStart || undefined,
          weekEnd: weekEnd || undefined,
          notes: "Auto: Other (week-based) applied to bill",
        });
      }
    }

    // Update outstanding balance
    const billAmount = finalAmountWithPenalty;
    if (billAmount !== 0 && owner?.id) {
      const { data: driverRow } = await supabase
        .from(DRIVER_TABLE)
        .select("outstanding_balance")
        .eq("id", owner.id)
        .single();
      const currentOutstanding = Number(driverRow?.outstanding_balance || 0);
      const newOutstanding = currentOutstanding + billAmount;
      await supabase
        .from(DRIVER_TABLE)
        .update({ outstanding_balance: newOutstanding })
        .eq("id", owner.id);
    }

    // Insert bill ledger entry for week-based balance tracking
    if (billAmount !== 0 && weekStart && weekEnd && bill?.id) {
      await supabase.from("tvp_driver_payments").insert({
        driver_id: owner.id,
        bill_id: bill.id,
        payment_amount: billAmount,
        payment_date: weekEnd,
        payment_type: "bill",
        week_start: weekStart,
        week_end: weekEnd,
      });
    }

    return bill;
  } catch (error) {
    console.error("Error creating multi-vehicle bill:", error);
    throw error;
  }
};

// Create a draft bill
export const createDraftBill = async (billData) => {
  try {
    const billNumber = `DRAFT-${Date.now()}-${(billData.driverId || "TEMP")
      .slice(-6)
      .toUpperCase()}`;
    
    const { data, error } = await supabase
      .from("tvp_driver_bills")
      .insert({
        driver_id: billData.driverId,
        bill_number: billNumber,
        tvp_id: billData.tvpId || "",
        driver_name: billData.driverName || "",
        vehicle_number: billData.vehicleNumber || "",
        rental_days: billData.rentalDays || 0,
        trips: billData.trips || 0,
        daily_rent: billData.dailyRent || 0,
        weekly_insurance: billData.weeklyInsurance || 210,
        double_driver_charge: billData.doubleDriverCharge || 0,
        net_weekly_rent: billData.netWeeklyRent || 0,
        total_earnings: billData.totalEarnings || 0,
        total_cash_collect: billData.totalCashCollect || 0,
        difference: billData.difference || 0,
        platform_fee: billData.platformFee || 0,
        toll: billData.toll || 0,
        tds: billData.tds || 0,
        vehicle_adjustment: billData.vehicleAdjustment || 0,
        rto_fine: billData.rtoFine || 0,
        accident: billData.accident || 0,
        dead_km: billData.deadKm || 0,
        current_os: billData.currentOS || 0,
        week_start: billData.weekStart || null,
        week_end: billData.weekEnd || null,
        invoice_html: null,
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating draft bill:", error);
    throw error;
  }
};

// Bulk create draft bills
export const bulkCreateDraftBills = async (billsData) => {
  try {
    const baseTimestamp = Date.now();
    const billsToInsert = billsData.map((billData, index) => {
      const billNumber = `DRAFT-${baseTimestamp}-${index}-${Math.random()
        .toString(36)
        .substr(2, 6)
        .toUpperCase()}`;
      return {
        driver_id: billData.driverId,
        bill_number: billNumber,
        tvp_id: billData.tvpId || "",
        driver_name: billData.driverName || "",
        vehicle_number: billData.vehicleNumber || "",
        rental_days: billData.rentalDays || 0,
        trips: billData.trips || 0,
        daily_rent: billData.dailyRent || 0,
        weekly_insurance: billData.weeklyInsurance || 210,
        double_driver_charge: billData.doubleDriverCharge || 0,
        net_weekly_rent: billData.netWeeklyRent || 0,
        total_earnings: billData.totalEarnings || 0,
        total_cash_collect: billData.totalCashCollect || 0,
        difference: billData.difference || 0,
        platform_fee: billData.platformFee || 0,
        toll: billData.toll || 0,
        tds: billData.tds || 0,
        vehicle_adjustment: billData.vehicleAdjustment || 0,
        rto_fine: billData.rtoFine || 0,
        accident: billData.accident || 0,
        dead_km: billData.deadKm || 0,
        room_rent: billData.roomRent || 0,
        current_os: billData.currentOS || 0,
        week_start: billData.weekStart ?? null,
        week_end: billData.weekEnd ?? null,
        invoice_html: null,
        status: "draft",
      };
    });

    const { data, error } = await supabase
      .from("tvp_driver_bills")
      .insert(billsToInsert)
      .select();

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error bulk creating draft bills:", error);
    throw error;
  }
};

// Update a bill
export const updateBill = async (billId, billData) => {
  try {
    // Fetch existing bill for old amount, driver, and status (for generated-bill sync)
    const { data: existingBill, error: fetchError } = await supabase
      .from("tvp_driver_bills")
      .select("current_os, driver_id, status, bill_number, week_start, week_end, vehicles_breakdown, penalty_amount, penalty_other_amount")
      .eq("id", billId)
      .single();

    if (fetchError || !existingBill) {
      throw new Error(fetchError?.message || "Bill not found");
    }

    const oldCurrentOS = Number(existingBill.current_os || 0);
    const newCurrentOS = Number(billData.currentOS || 0);
    const driverId = existingBill.driver_id;
    const isGenerated = existingBill.status === "generated";

    // Regenerate invoice HTML with updated amounts
    const vehiclesForInvoice =
      existingBill.vehicles_breakdown && Array.isArray(existingBill.vehicles_breakdown)
        ? existingBill.vehicles_breakdown.map((v) => ({
            vehicleNumber: v.vehicleNumber || v.vehicle_number,
            rentalDays: Number(v.rentalDays || v.rental_days) || 0,
            trips: Number(v.trips) || 0,
            dailyRent: Number(v.dailyRent || v.daily_rent) || 0,
          }))
        : null;
    const invoiceHTML = generateInvoiceHTML({
      ...billData,
      currentOS: newCurrentOS,
      billNumber: existingBill.bill_number,
      vehicles: vehiclesForInvoice,
      penaltyAmount: billData.penaltyAmount ?? existingBill.penalty_amount ?? 0,
      penaltyOtherAmount: billData.penaltyOtherAmount ?? existingBill.penalty_other_amount ?? 0,
    });

    const updateData = {
      driver_id: billData.driverId,
      tvp_id: billData.tvpId,
      driver_name: billData.driverName,
      vehicle_number: billData.vehicleNumber,
      rental_days: billData.rentalDays,
      trips: billData.trips || 0,
      daily_rent: billData.dailyRent || 0,
      weekly_insurance: billData.weeklyInsurance || 210,
      double_driver_charge: billData.doubleDriverCharge || 0,
      net_weekly_rent: billData.netWeeklyRent || 0,
      total_earnings: billData.totalEarnings || 0,
      total_cash_collect: billData.totalCashCollect || 0,
      difference: billData.difference || 0,
      platform_fee: billData.platformFee || 0,
      toll: billData.toll || 0,
      tds: billData.tds || 0,
      vehicle_adjustment: billData.vehicleAdjustment || 0,
      rto_fine: billData.rtoFine || 0,
      accident: billData.accident || 0,
      dead_km: billData.deadKm || 0,
      room_rent: billData.roomRent ?? undefined,
      current_os: newCurrentOS,
      invoice_html: invoiceHTML,
      updated_at: new Date().toISOString(),
    };
    // Remove undefined so we don't overwrite with null
    Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k]);

    const { data, error } = await supabase
      .from("tvp_driver_bills")
      .update(updateData)
      .eq("id", billId)
      .select()
      .single();

    if (error) throw error;

    // For generated bills: sync driver outstanding and bill ledger entry
    if (isGenerated && driverId) {
      const delta = newCurrentOS - oldCurrentOS;
      if (delta !== 0) {
        const { data: driverRow } = await supabase
          .from(DRIVER_TABLE)
          .select("outstanding_balance")
          .eq("id", driverId)
          .single();
        const currentOutstanding = Number(driverRow?.outstanding_balance || 0);
        const newOutstanding = currentOutstanding + delta;
        await supabase
          .from(DRIVER_TABLE)
          .update({ outstanding_balance: newOutstanding })
          .eq("id", driverId);
      }

      // Update the "bill" ledger entry so week-based stats and balance stay correct
      const { data: ledgerRows } = await supabase
        .from("tvp_driver_payments")
        .select("id")
        .eq("bill_id", billId)
        .eq("payment_type", "bill");
      if (ledgerRows && ledgerRows.length > 0) {
        await supabase
          .from("tvp_driver_payments")
          .update({ payment_amount: newCurrentOS })
          .eq("bill_id", billId)
          .eq("payment_type", "bill");
      } else if (newCurrentOS !== 0 && existingBill.week_start && existingBill.week_end) {
        // Legacy bill with no ledger row: insert one for consistency
        await supabase.from("tvp_driver_payments").insert({
          driver_id: driverId,
          bill_id: billId,
          payment_amount: newCurrentOS,
          payment_date: existingBill.week_end,
          payment_type: "bill",
          week_start: existingBill.week_start,
          week_end: existingBill.week_end,
        });
      }
    }

    return data;
  } catch (error) {
    console.error("Error updating bill:", error);
    throw error;
  }
};

// Get all draft bills
export const getDraftBills = async () => {
  try {
    const { data, error } = await supabase
      .from("tvp_driver_bills")
      .select("*")
      .eq("status", "draft")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching draft bills:", error);
    throw error;
  }
};

// Format date for filename (e.g., "12 jan 2026")
const formatDateForFilename = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" }).toLowerCase();
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Export bill to PDF with proper filename
export const exportBillToPDF = (bill) => {
  try {
    console.log("Exporting bill to PDF:", bill);

    // Always regenerate invoice from bill data so penalty/penalty_other and totals are correct
    // (stored invoice_html may be stale when called right after createDriverBill)
    const vehiclesBreakdown = bill.vehicles_breakdown || null;
    const vehiclesForInvoice = vehiclesBreakdown && Array.isArray(vehiclesBreakdown) && vehiclesBreakdown.length > 0
      ? vehiclesBreakdown.map(v => ({
          vehicleNumber: v.vehicleNumber || v.vehicle_number,
          rentalDays: Number(v.rentalDays || v.rental_days) || 0,
          trips: Number(v.trips) || 0,
          dailyRent: Number(v.dailyRent || v.daily_rent) || 0,
        }))
      : (bill.vehicles && Array.isArray(bill.vehicles)) ? bill.vehicles : null;

    const invoiceHTML = generateInvoiceHTML({
      driverId: bill.driver_id || bill.driverId,
      tvpId: bill.tvp_id || bill.tvpId,
      driverName: bill.driver_name || bill.driverName,
      vehicleNumber: bill.vehicle_number || bill.vehicleNumber,
      rentalDays: bill.rental_days || bill.rentalDays,
      trips: bill.trips,
      dailyRent: bill.daily_rent || bill.dailyRent,
      weeklyInsurance: bill.weekly_insurance || bill.weeklyInsurance,
      doubleDriverCharge: bill.double_driver_charge || bill.doubleDriverCharge,
      netWeeklyRent: bill.net_weekly_rent || bill.netWeeklyRent,
      totalEarnings: bill.total_earnings || bill.totalEarnings,
      totalCashCollect: bill.total_cash_collect || bill.totalCashCollect,
      difference: bill.difference,
      platformFee: bill.platform_fee || bill.platformFee,
      toll: bill.toll,
      tds: bill.tds,
      vehicleAdjustment: bill.vehicle_adjustment || bill.vehicleAdjustment,
      rtoFine: bill.rto_fine || bill.rtoFine,
      accident: bill.accident,
      deadKm: bill.dead_km || bill.deadKm,
      roomRent: bill.room_rent || bill.roomRent || 0,
      currentOS: bill.current_os || bill.currentOS,
      penaltyAmount: bill.penalty_amount ?? bill.penaltyAmount ?? 0,
      penaltyOtherAmount: bill.penalty_other_amount ?? bill.penaltyOtherAmount ?? 0,
      billNumber: bill.bill_number || bill.billNumber,
      vehicles: vehiclesForInvoice,
    });

    // Generate filename: "Owner Name (Week Start to Week End).pdf"
    // Check both snake_case and camelCase property names
    const ownerName = (bill.driver_name || bill.driverName || "Unknown").trim();
    const weekStart = bill.week_start || bill.weekStart;
    const weekEnd = bill.week_end || bill.weekEnd;
    
    console.log("Filename generation - Raw data:", {
      ownerName,
      weekStart,
      weekEnd,
      bill_driver_name: bill.driver_name,
      bill_driverName: bill.driverName,
      bill_week_start: bill.week_start,
      bill_weekStart: bill.weekStart,
      bill_week_end: bill.week_end,
      bill_weekEnd: bill.weekEnd,
    });
    
    let filename = ownerName;
    
    if (weekStart && weekEnd) {
      try {
        const formattedWeekStart = formatDateForFilename(weekStart);
        const formattedWeekEnd = formatDateForFilename(weekEnd);
        filename = `${ownerName} (${formattedWeekStart} to ${formattedWeekEnd})`;
        console.log("✓ Generated filename with week dates:", filename);
      } catch (error) {
        console.error("Error formatting dates:", error);
        const billNumber = bill.bill_number || bill.billNumber || "BILL";
        filename = `${ownerName} (${billNumber})`;
      }
    } else {
      // Fallback: use bill number if week range not available
      const billNumber = bill.bill_number || bill.billNumber || "BILL";
      filename = `${ownerName} (${billNumber})`;
      console.warn("⚠ Week dates missing, using bill number:", filename);
    }
    
    // Sanitize filename (remove invalid characters)
    filename = filename.replace(/[<>:"/\\|?*]/g, "_");
    filename = `${filename}.pdf`;
    
    console.log("✓ Final filename:", filename);

    // Open print window with the invoice
    // Note: Browser print dialog will use default filename, but we'll set title
    // Users can choose "Save as PDF" in the print dialog and rename it
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      throw new Error("Pop-up blocked. Please allow pop-ups for this site.");
    }
    
    // Embed filename in the HTML as a comment and in title for reference
    const htmlWithFilename = invoiceHTML.replace(
      '<title>',
      `<title>${filename.replace('.pdf', '')}</title>`
    );
    
    printWindow.document.write(htmlWithFilename);
    printWindow.document.close();
    printWindow.document.title = filename.replace('.pdf', '');
    printWindow.focus();

    // Wait for content to load, then trigger print
    // The filename will be shown in the document title and can be used when saving
    setTimeout(() => {
      printWindow.print();
      // Show a message to the user about the filename
      console.log(`PDF ready for print. Suggested filename: ${filename}`);
    }, 500);

    // Return filename for reference
    return filename;
  } catch (error) {
    console.error("Error exporting bill to PDF:", error);
    throw error;
  }
};

// Finalize a bill (change status from draft to generated and create invoice)
export const finalizeBill = async (billId) => {
  try {
    // Get the bill first
    const bill = await getBillById(billId);

    // Fetch driver's pending penalty to apply to this bill
    const { data: driverRowForPenalty } = await supabase
      .from(DRIVER_TABLE)
      .select("penalty_amount")
      .eq("id", bill.driver_id)
      .single();
    const driverPenalty = Number(driverRowForPenalty?.penalty_amount || 0);
    const baseCurrentOS = Number(bill.current_os || 0);
    const penaltyToApply = Math.max(0, driverPenalty);

    // Fetch penalty_other for this driver and bill week
    let penaltyOtherSum = 0;
    let penaltyOtherRows = [];
    const billWeekStart = bill.week_start || null;
    const billWeekEnd = bill.week_end || null;
    if (billWeekStart && billWeekEnd) {
      const { data: otherRows } = await supabase
        .from("tvp_driver_payments")
        .select("id, payment_amount")
        .eq("driver_id", bill.driver_id)
        .eq("payment_type", "penalty_other")
        .is("applied_bill_id", null)
        .eq("week_start", billWeekStart)
        .eq("week_end", billWeekEnd);
      penaltyOtherRows = otherRows || [];
      penaltyOtherSum = penaltyOtherRows.reduce((sum, r) => sum + Number(r.payment_amount || 0), 0);
    }

    const finalCurrentOS = baseCurrentOS + penaltyToApply + penaltyOtherSum;

    // Generate new bill number (remove DRAFT- prefix if present, add INV-)
    let newBillNumber = bill.bill_number;
    if (newBillNumber.startsWith("DRAFT-")) {
      newBillNumber = "INV-" + newBillNumber.substring(6);
    } else if (!newBillNumber.startsWith("INV-")) {
      newBillNumber = `INV-${Date.now()}-${
        bill.driver_id?.slice(-6).toUpperCase() || "BILL"
      }`;
    }

    // Get vehicles breakdown from bill if available
    const vehiclesBreakdown = bill.vehicles_breakdown || null;
    const vehiclesForInvoice = vehiclesBreakdown && Array.isArray(vehiclesBreakdown) && vehiclesBreakdown.length > 0
      ? vehiclesBreakdown.map(v => ({
          vehicleNumber: v.vehicleNumber || v.vehicle_number,
          rentalDays: Number(v.rentalDays || v.rental_days) || 0,
          trips: Number(v.trips) || 0,
          dailyRent: Number(v.dailyRent || v.daily_rent) || 0,
        }))
      : null;

    // Generate invoice HTML (with penalty and final amount)
    const invoiceHTML = generateInvoiceHTML({
      driverId: bill.driver_id,
      tvpId: bill.tvp_id,
      driverName: bill.driver_name,
      vehicleNumber: bill.vehicle_number,
      rentalDays: bill.rental_days,
      trips: bill.trips,
      dailyRent: bill.daily_rent,
      weeklyInsurance: bill.weekly_insurance,
      doubleDriverCharge: bill.double_driver_charge,
      netWeeklyRent: bill.net_weekly_rent,
      totalEarnings: bill.total_earnings,
      totalCashCollect: bill.total_cash_collect,
      difference: bill.difference,
      platformFee: bill.platform_fee,
      toll: bill.toll,
      tds: bill.tds,
      vehicleAdjustment: bill.vehicle_adjustment,
      rtoFine: bill.rto_fine,
      accident: bill.accident,
      deadKm: bill.dead_km,
      roomRent: bill.room_rent || 0,
      penaltyAmount: penaltyToApply,
      penaltyOtherAmount: penaltyOtherSum,
      currentOS: finalCurrentOS,
      billNumber: newBillNumber,
      vehicles: vehiclesForInvoice,
    });

    // Update the bill with generated status, invoice HTML, final amount and penalty
    const { data, error } = await supabase
      .from("tvp_driver_bills")
      .update({
        status: "generated",
        invoice_html: invoiceHTML,
        bill_number: newBillNumber,
        current_os: finalCurrentOS,
        penalty_amount: penaltyToApply,
        penalty_other_amount: penaltyOtherSum,
      })
      .eq("id", billId)
      .select()
      .single();

    if (error) throw error;

    // Update outstanding balance when finalizing draft (use final amount including penalty)
    const billAmount = finalCurrentOS;
    if (billAmount !== 0 && bill.driver_id) {
      const { data: driverRow } = await supabase
        .from(DRIVER_TABLE)
        .select("outstanding_balance")
        .eq("id", bill.driver_id)
        .single();
      const currentOutstanding = Number(driverRow?.outstanding_balance || 0);
      const newOutstanding = currentOutstanding + billAmount;
      const { error: balanceError } = await supabase
        .from(DRIVER_TABLE)
        .update({ outstanding_balance: newOutstanding })
        .eq("id", bill.driver_id);
      if (balanceError) {
        console.error("Error updating outstanding balance on finalize:", balanceError);
      }
    }

    // Reduce driver's pending penalty by the amount applied to this bill
    if (penaltyToApply > 0 && bill.driver_id) {
      const newDriverPenalty = Math.max(0, driverPenalty - penaltyToApply);
      await supabase
        .from(DRIVER_TABLE)
        .update({ penalty_amount: newDriverPenalty })
        .eq("id", bill.driver_id);
    }

    // Mark penalty_other as applied and add penalty_paid
    if (penaltyOtherRows.length > 0 && billId) {
      await supabase
        .from("tvp_driver_payments")
        .update({ applied_bill_id: billId })
        .in("id", penaltyOtherRows.map((r) => r.id));
      if (penaltyOtherSum > 0 && bill.driver_id) {
        await createDriverPayment({
          driverId: bill.driver_id,
          paymentType: "penalty_paid",
          account: "letzryd",
          paymentAmount: penaltyOtherSum,
          paymentDate: billWeekEnd || new Date().toISOString().split("T")[0],
          weekStart: billWeekStart || undefined,
          weekEnd: billWeekEnd || undefined,
          notes: "Auto: Other (week-based) applied to bill",
        });
      }
    }

    // Insert "bill" ledger entry for week-based balance tracking
    const weekStart = bill.week_start;
    const weekEnd = bill.week_end;
    if (billAmount !== 0 && weekStart && weekEnd && bill.driver_id) {
      const { error: paymentError } = await supabase
        .from("tvp_driver_payments")
        .insert({
          driver_id: bill.driver_id,
          bill_id: billId,
          payment_amount: billAmount,
          payment_date: weekEnd,
          payment_type: "bill",
          week_start: weekStart,
          week_end: weekEnd,
        });
      if (paymentError) {
        console.error("Error inserting bill ledger entry on finalize:", paymentError);
      }
    }

    return data;
  } catch (error) {
    console.error("Error finalizing bill:", error);
    throw error;
  }
};

// Normalize vehicle number for matching
const normalizeVehicleNumber = (vehicleNumber) => {
  if (!vehicleNumber) return "";
  return vehicleNumber
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .trim();
};

// Match vehicle and find TVP owner/driver
export const matchVehicleAndDriver = async (vehicleNumber) => {
  try {
    const normalizedNumber = normalizeVehicleNumber(vehicleNumber);
    console.log(`Matching vehicle number: "${vehicleNumber}" (normalized: "${normalizedNumber}")`);
    
    // First, find driver in tvp_drivers table by vehicle number in vehicle_numbers array
    const { data: drivers, error: driversError } = await supabase
      .from(DRIVER_TABLE)
      .select("*")
      .eq("status", "active");

    if (driversError) {
      console.warn("Error fetching drivers:", driversError);
    }

    // Find driver whose vehicle_numbers array contains the vehicle number
    const matchedDriver = (drivers || []).find((driver) => {
      const vehicleNumbers = driver.vehicle_numbers || [];
      return vehicleNumbers.some(
        (vn) => normalizeVehicleNumber(vn) === normalizedNumber
      );
    });

    if (matchedDriver) {
      console.log(`Found driver in tvp_drivers: ${matchedDriver.full_name} (${matchedDriver.id})`);
      
      // Map driver row to driver object
      const driver = mapDriverRow(matchedDriver);
      
      // Try to find vehicle in cars table as well
      let matchedVehicle = null;
      const { data: vehicles } = await supabase
        .from("cars")
        .select("*")
        .eq("status", "active");

      if (vehicles) {
        matchedVehicle = (vehicles || []).find(
          (v) => normalizeVehicleNumber(v.car_number) === normalizedNumber
        );
      }

      // Try to get TVP owner if vehicle has tvp_owner_id
      let tvpOwner = null;
      if (matchedVehicle?.tvp_owner_id) {
        const { data: user } = await supabase
          .from("users")
          .select(
            `
            id,
            email,
            user_profiles!user_id (
              full_name,
              phone
            )
          `
          )
          .eq("id", matchedVehicle.tvp_owner_id)
          .single();

        if (user) {
          const profile = Array.isArray(user?.user_profiles) 
            ? user.user_profiles[0] 
            : user?.user_profiles;

          tvpOwner = {
            id: user.id,
            email: user.email,
            name: profile?.full_name || user.email,
          };
        }
      }

      return {
        matched: true,
        vehicle: matchedVehicle,
        driver: driver,
        tvpOwner: tvpOwner,
      };
    }

    // If no driver found in tvp_drivers, try to find vehicle in cars table
    const { data: vehicles, error: vehiclesError } = await supabase
      .from("cars")
      .select("*")
      .eq("status", "active");

    if (vehiclesError) throw vehiclesError;

    // Match vehicle by normalized number
    const matchedVehicle = (vehicles || []).find(
      (v) => normalizeVehicleNumber(v.car_number) === normalizedNumber
    );

    if (matchedVehicle && matchedVehicle.tvp_owner_id) {
      console.log(`Found vehicle in cars table: ${matchedVehicle.car_number}`);

    // Get TVP owner (user) details
    const { data: user, error: userError } = await supabase
      .from("users")
        .select(
          `
        id,
        email,
        user_profiles!user_id (
          full_name,
          phone
        )
        `
        )
      .eq("id", matchedVehicle.tvp_owner_id)
      .single();

    if (userError) {
      console.warn("Error fetching user data:", userError);
    }

    const profile = Array.isArray(user?.user_profiles) 
      ? user.user_profiles[0] 
      : user?.user_profiles;

      const tvpOwner = user
        ? {
      id: user.id,
      email: user.email,
      name: profile?.full_name || user.email,
        }
        : null;

      // Try to find driver for this owner
      const { data: ownerDrivers } = await supabase
      .from(DRIVER_TABLE)
        .select("*")
        .eq("status", "active");

      // Try to find a driver that might be associated with this owner
      // This is a fallback - ideally the vehicle should be in vehicle_numbers array
      let driver = null;
      if (ownerDrivers) {
        // Check if any driver has this vehicle in their vehicle_numbers
        const driverWithVehicle = ownerDrivers.find((d) => {
          const vehicleNumbers = d.vehicle_numbers || [];
          return vehicleNumbers.some(
            (vn) => normalizeVehicleNumber(vn) === normalizedNumber
          );
        });
        
        if (driverWithVehicle) {
          driver = mapDriverRow(driverWithVehicle);
        } else if (ownerDrivers.length > 0) {
          // Fallback: use the first driver for this owner (not ideal, but better than nothing)
          driver = mapDriverRow(ownerDrivers[0]);
          console.warn(`Vehicle ${vehicleNumber} found in cars but not in driver's vehicle_numbers. Using first driver as fallback.`);
        }
      }

      if (driver || tvpOwner) {
        return {
          matched: true,
          vehicle: matchedVehicle,
          driver: driver,
          tvpOwner: tvpOwner,
        };
      }
    }

    console.warn(`No match found for vehicle number: "${vehicleNumber}" (normalized: "${normalizedNumber}")`);
    return {
      matched: false,
      vehicle: null,
      driver: null,
      tvpOwner: null,
    };

    // If no driver found by vehicle number, try to find by user ID (if there's a relation)
    // For now, we'll use the TVP owner as the driver if no specific driver is found
    let driver = null;
    if (matchedDriver) {
      driver = mapDriverRow(matchedDriver);
    } else if (tvpOwner) {
      // Use TVP owner as fallback driver
      driver = {
        id: tvpOwner.id,
        tvpId: tvpOwner.email,
        name: tvpOwner.name,
        vehicleNumbers: [vehicleNumber],
      };
    }

    return {
      matched: true,
      vehicle: matchedVehicle,
      driver: driver,
      tvpOwner: tvpOwner,
    };
  } catch (error) {
    console.error("Error matching vehicle and driver:", error);
    throw error;
  }
};

// Generate invoice HTML
export const generateInvoiceHTML = (billData) => {
  const invoiceDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Helper function to check if value is non-zero
  const hasValue = (val) => {
    const num = Number(val || 0);
    return num !== 0 && !isNaN(num);
  };

  // Helper function to format number
  const formatAmount = (val) => Number(val || 0).toFixed(2);

  // Extract all values for conditional rendering
  const netWeeklyRent = Number(billData.netWeeklyRent || 0);
  const totalEarnings = Number(billData.totalEarnings || 0);
  const totalCashCollect = Number(billData.totalCashCollect || 0);
  const difference = Number(billData.difference || 0);
  const toll = Number(billData.toll || 0);
  const platformFee = Number(billData.platformFee || 0);
  const tds = Number(billData.tds || 0);
  const vehicleAdjustment = Number(billData.vehicleAdjustment || 0);
  const rtoFine = Number(billData.rtoFine || 0);
  const accident = Number(billData.accident || 0);
  const deadKm = Number(billData.deadKm || 0);
  const penaltyAmount = Number(billData.penaltyAmount ?? billData.penalty_amount ?? 0);
  const penaltyOtherAmount = Number(billData.penaltyOtherAmount ?? billData.penalty_other_amount ?? 0);
  const accidentPenaltyAmount = Number(billData.accidentPenaltyAmount ?? billData.accident_penalty_amount ?? 0);
  const roomRent = Number(billData.roomRent || 0);
  const doubleDriverCharge = Number(billData.doubleDriverCharge || 0);
  const dailyRent = Number(billData.dailyRent || 0);
  const weeklyInsurance = Number(billData.weeklyInsurance || 210);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${billData.billNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .invoice-container { max-width: 800px; margin: 0 auto; background: white; }
    .company-header { display: flex; align-items: center; gap: 20px; padding-bottom: 20px; margin-bottom: 20px; border-bottom: 3px solid #7A61FB; }
    .company-logo { width: 80px; height: 80px; flex-shrink: 0; }
    .company-logo svg { width: 100%; height: 100%; }
    .company-info { flex: 1; }
    .company-name { font-size: 28px; font-weight: 700; color: #7A61FB; margin-bottom: 4px; }
    .company-subtitle { font-size: 14px; color: #666; margin-bottom: 8px; font-style: italic; }
    .company-phone { font-size: 14px; color: #666; }
    .invoice-header { padding-bottom: 20px; margin-bottom: 30px; }
    .invoice-header h1 { color: #2563eb; font-size: 28px; margin-bottom: 10px; }
    .invoice-header p { color: #666; font-size: 14px; }
    .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .info-box h3 { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px; }
    .info-box p { font-size: 16px; font-weight: 600; color: #333; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .table th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    .table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .table tr:last-child td { border-bottom: none; }
    .text-right { text-align: right; }
    .text-bold { font-weight: 600; }
    .total-section { background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .total-row.final { font-size: 18px; font-weight: 700; color: #2563eb; padding-top: 10px; border-top: 2px solid #e5e7eb; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="company-header">
      <div class="company-logo">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" style="width: 100%; height: 100%;">
          <path d="M0 0 C6.27 0 12.54 0 19 0 C19 0.33 19 0.66 19 1 C24.28 1.33 29.56 1.66 35 2 C35 2.66 35 3.32 35 4 C42.59 4 50.18 4 58 4 C58 4.66 58 5.32 58 6 C60.64 6 63.28 6 66 6 C66 6.66 66 7.32 66 8 C70.62 8 75.24 8 80 8 C80 8.66 80 9.32 80 10 C80.804375 9.979375 81.60875 9.95875 82.4375 9.9375 C85 10 85 10 86 11 C87.53851559 11.15915679 89.08137761 11.27706625 90.625 11.375 C95.27307226 11.79094965 98.74635342 13.03071918 103 15 C105.01079595 15.57451313 107.02951182 16.05484777 109.06640625 16.52734375 C111.76785095 17.1876969 114.3768326 18.08189141 117 19 C117 19.66 117 20.32 117 21 C118.32 21 119.64 21 121 21 C121 21.66 121 22.32 121 23 C122.258125 22.938125 123.51625 22.87625 124.8125 22.8125 C128.78986165 22.79861741 128.78986165 22.79861741 130.5 24.4375 C130.995 24.953125 131.49 25.46875 132 26 C133.92391648 26.31266405 133.92391648 26.31266405 136.0625 26.4375 C137.361875 26.623125 138.66125 26.80875 140 27 C141.5 29.0625 141.5 29.0625 142 31 C144.01822917 30.90234375 146.03645833 30.8046875 148.0546875 30.70703125 C148.69664062 30.80371094 149.33859375 30.90039062 150 31 C150.99 32.485 150.99 32.485 152 34 C152.99 34.144375 153.98 34.28875 155 34.4375 C156.485 34.7159375 156.485 34.7159375 158 35 C159.375 37.0625 159.375 37.0625 160 39 C161.98 39 163.96 39 166 39 C166 39.66 166 40.32 166 41 C168.88213522 42.04291154 168.88213522 42.04291154 171.5 42.4375 C174 43 174 43 177 45 C177 45.66 177 46.32 177 47 C177.53625 47.103125 178.0725 47.20625 178.625 47.3125 C181.62502044 48.18092697 184.2379535 49.55620296 187 51 C187 51.66 187 52.32 187 53 C189.97 53.495 189.97 53.495 193 54 C193 54.99 193 55.98 193 57 C194.32 57 195.64 57 197 57 C197 57.66 197 58.32 197 59 C199.65228812 60.07525194 202.28368454 61.09456151 205 62 C205 62.66 205 63.32 205 64 C205.66 64 206.32 64 207 64 C207 64.66 207 65.32 207 66 C207.639375 66.103125 208.27875 66.20625 208.9375 66.3125 C209.618125 66.539375 210.29875 66.76625 211 67 C211.33 67.99 211.66 68.98 212 70 C213.32 70 214.64 70 216 70 C216 70.66 216 71.32 216 72 C216.66 72 217.32 72 218 72 C218 72.66 218 73.32 218 74 C218.61875 74.144375 219.2375 74.28875 219.875 74.4375 C222 75 222 75 224 76 C224 76.66 224 77.32 224 78 C224.66 78 225.32 78 226 78 C226 78.66 226 79.32 226 80 C226.66 80 227.32 80 228 80 C228 80.66 228 81.32 228 82 C228.66 82 229.32 82 230 82 C230 82.66 230 83.32 230 84 C231.32 84 232.64 84 234 84 C234 84.66 234 85.32 234 86 C234.66 86 235.32 86 236 86 C236 86.66 236 87.32 236 88 C236.66 88 237.32 88 238 88 C238 88.66 238 89.32 238 90 C238.66 90 239.32 90 240 90 C240 90.66 240 91.32 240 92 C241.32 92 242.64 92 244 92 C244 92.66 244 93.32 244 94 C244.66 94 245.32 94 246 94 C246 94.66 246 95.32 246 96 C246.66 96 247.32 96 248 96 C248 96.66 248 97.32 248 98 C248.598125 98.268125 249.19625 98.53625 249.8125 98.8125 C251.99847854 99.99917406 253.41332594 101.09599113 255 103 C255 103.66 255 104.32 255 105 C255.66 105 256.32 105 257 105 C257 105.66 257 106.32 257 107 C257.66 107 258.32 107 259 107 C259 107.66 259 108.32 259 109 C260.32 109.66 261.64 110.32 263 111 C263 111.66 263 112.32 263 113 C263.66 113 264.32 113 265 113 C265 113.66 265 114.32 265 115 C265.66 115 266.32 115 267 115 C267 115.66 267 116.32 267 117 C267.66 117 268.32 117 269 117 C269 117.66 269 118.32 269 119 C269.66 119 270.32 119 271 119 C271 119.66 271 120.32 271 121 C271.66 121 272.32 121 273 121 C273 122.32 273 123.64 273 125 C274.32 125 275.64 125 277 125 C277 126.32 277 127.64 277 129 C277.66 129 278.32 129 279 129 C279 129.66 279 130.32 279 131 C279.66 131 280.32 131 281 131 C283.125 132.75 283.125 132.75 285 135 C285 136.32 285 137.64 285 139 C285.66 139 286.32 139 287 139 C287 139.66 287 140.32 287 141 C287.66 141 288.32 141 289 141 C289 141.66 289 142.32 289 143 C289.66 143 290.32 143 291 143 C294 147.38461538 294 147.38461538 294 150 C294.66 150 295.32 150 296 150 C296 151.32 296 152.64 296 154 C297.32 154 298.64 154 300 154 C300 155.32 300 156.64 300 158 C300.66 158 301.32 158 302 158 C302 158.66 302 159.32 302 160 C302.66 160 303.32 160 304 160 C304 161.32 304 162.64 304 164 C304.66 164 305.32 164 306 164 C306 164.66 306 165.32 306 166 C306.66 166 307.32 166 308 166 C308 167.98 308 169.96 308 172 C309.32 172 310.64 172 312 172 C312.144375 172.763125 312.28875 173.52625 312.4375 174.3125 C312.9632594 177.08172908 312.9632594 177.08172908 314 180 C314.66 180 315.32 180 316 180 C317.4606285 182.64738916 318 183.89448334 318 187 C318.66 187 319.32 187 320 187 C320 188.32 320 189.64 320 191 C320.66 191 321.32 191 322 191 C322 192.32 322 193.64 322 195 C322.66 195 323.32 195 324 195 C324 196.32 324 197.64 324 199 C324.66 199 325.32 199 326 199 C326 200.32 326 201.64 326 203 C326.66 203 327.32 203 328 203 C328 204.32 328 205.64 328 207 C328.66 207 329.32 207 330 207 C330 208.32 330 209.64 330 211 C330.66 211 331.32 211 332 211 C332 212.32 332 213.64 332 215 C332.99 215.33 333.98 215.66 335 216 C335.73080266 217.97746603 336.39421747 219.98072489 337 222 C337.66 222.99 338.32 223.98 339 225 C339.56120851 226.5064018 340.07998972 228.02907729 340.5625 229.5625 C341.27618593 231.81449343 341.94322352 233.88644704 343 236 C343.039992 237.99960012 343.04346799 240.00047242 343 242 C343.66 242 344.32 242 345 242 C345 243.32 345 244.64 345 246 C345.66 246 346.32 246 347 246 C347 247.98 347 249.96 347 252 C347.66 252 348.32 252 349 252 C349 254.31 349 256.62 349 259 C349.66 259 350.32 259 351 259 C351 260.98 351 262.96 351 265 C351.66 265 352.32 265 353 265 C353 268.3 353 271.6 353 275 C353.66 275 354.32 275 355 275 C357.37590142 278.70416126 357.20500286 281.92984573 357.125 286.25 C357.10695313 287.51328125 357.08890625 288.7765625 357.0703125 290.078125 C357.03550781 291.52445313 357.03550781 291.52445313 357 293 C357.66 293 358.32 293 359 293 C359.33 294.98 359.66 296.96 360 299 C360.33 299 360.66 299 361 299 C361 305.27 361 311.54 361 318 C361.66 318 362.32 318 363 318 C363.33 320.64 363.66 323.28 364 326 C364.33 326 364.66 326 365 326 C365 340.52 365 355.04 365 370 C318.8 370 272.6 370 225 370 C223.33278054 366.66556107 223.86740858 362.9215049 223.87974548 359.25558472 C223.87846146 357.88427399 223.87846146 357.88427399 223.87715149 356.48526001 C223.87548833 353.39363696 223.88103282 350.30206736 223.88647461 347.21044922 C223.88678075 344.96744857 223.88664779 342.72444782 223.88610935 340.48144722 C223.88588292 334.45656154 223.89169284 328.43169559 223.89871979 322.40681458 C223.90440061 316.76022273 223.90468214 311.11363577 223.90539551 305.46704102 C223.91064984 288.93635805 223.92461089 272.40567878 223.9375 255.875 C223.958125 218.95625 223.97875 182.0375 224 144 C112.625 143.505 112.625 143.505 -1 143 C-1.020625 119.961875 -1.04125 96.92375 -1.0625 73.1875 C-1.071604 65.90582764 -1.08070801 58.62415527 -1.09008789 51.12182617 C-1.09460449 42.24865723 -1.09460449 42.24865723 -1.09544373 38.0983429 C-1.09637758 35.19180034 -1.10013386 32.28527595 -1.10557556 29.3787384 C-1.11241907 25.67457226 -1.11449403 21.97043263 -1.11307228 18.26626074 C-1.11351035 16.26096762 -1.11888188 14.25567746 -1.12442875 12.25039196 C-1.12305125 11.07074525 -1.12167376 9.89109854 -1.12025452 8.67570496 C-1.12117631 7.64606219 -1.1220981 6.61641943 -1.12304783 5.55557537 C-1 3 -1 3 0 0 Z " fill="#7A61FB" transform="translate(217,327)"/>
          <path d="M0 0 C33.33 0 66.66 0 101 0 C102.31805799 2.63611598 102.12590187 4.59552715 102.12698364 7.54872131 C102.12980347 8.72800705 102.13262329 9.90729279 102.13552856 11.12231445 C102.13249222 13.07282715 102.13249222 13.07282715 102.12939453 15.06274414 C102.13074897 16.4407099 102.13252915 17.8186753 102.13470459 19.19664001 C102.13927338 22.94441208 102.13749174 26.69215669 102.1343255 30.43992925 C102.13179956 34.35525288 102.13414005 38.27057411 102.13571167 42.18589783 C102.13753246 48.76073632 102.13512919 55.3355636 102.13037109 61.91040039 C102.12492639 69.52213027 102.12669301 77.13383338 102.1321975 84.74556261 C102.1367285 91.2712569 102.13737931 97.7969431 102.13475883 104.32263845 C102.13319627 108.22442053 102.13300175 112.12618999 102.13629532 116.02797127 C102.13917392 119.69441933 102.13719856 123.3608327 102.13140106 127.02727699 C102.12943788 129.02258887 102.13242731 131.01790367 102.13552856 133.01321411 C102.13270874 134.18968002 102.12988892 135.36614594 102.12698364 136.57826233 C102.1264181 138.1215954 102.1264181 138.1215954 102.12584114 139.69610691 C102 142 102 142 101 143 C98.06695272 143.09797065 95.15744612 143.12991804 92.22398376 143.12025452 C90.82612722 143.12153615 90.82612722 143.12153615 89.40003115 143.12284368 C86.25226407 143.12450134 83.10454934 143.11897247 79.95678711 143.11352539 C77.71036277 143.11324355 75.46393833 143.11340118 73.21751404 143.1139679 C67.09792571 143.11425601 60.97835679 143.10835706 54.85877299 143.10139394 C48.47124373 143.09516269 42.08371408 143.09455678 35.69618225 143.09336853 C24.96826781 143.09060882 14.24036189 143.08435329 3.51245117 143.07543945 C-7.53930628 143.06626606 -18.59106178 143.05918487 -29.64282227 143.05493164 C-30.32359453 143.05466892 -31.0043668 143.05440619 -31.70576853 143.05413551 C-35.12086613 143.05283051 -38.53596375 143.05156679 -41.95106137 143.05032361 C-70.30071251 143.03995012 -98.65035587 143.02225692 -127 143 C-129.41160888 135.76517335 -128.55809062 126.44421076 -127 119 C-126.505 118.505 -126.505 118.505 -126 118 C-125.65458149 115.66842508 -125.32205743 113.33491639 -125 111 C-124.67 110.01 -124.34 109.02 -124 108 C-123.64456573 105.66993089 -123.3086247 103.33672984 -123 101 C-122.34 101 -121.68 101 -121 101 C-121 99.35 -121 97.7 -121 96 C-120.67 96 -120.34 96 -120 96 C-119.67 93.36 -119.34 90.72 -119 88 C-118.34 88 -117.68 88 -117 88 C-116.855625 87.4225 -116.71125 86.845 -116.5625 86.25 C-116.04166667 84.16666667 -115.52083333 82.08333333 -115 80 C-114.34 80 -113.68 80 -113 80 C-113 78.68 -113 77.36 -113 76 C-112.34 76 -111.68 76 -111 76 C-110.87625 75.05125 -110.7525 74.1025 -110.625 73.125 C-110 70 -110 70 -108 68 C-107.67 67.34 -107.34 66.68 -107 66 C-106.01 66 -105.02 66 -104 66 C-104.2475 65.4225 -104.495 64.845 -104.75 64.25 C-104.87375 63.13625 -104.87375 63.13625 -105 62 C-103.125 59.875 -103.125 59.875 -101 58 C-100.67 57.34 -100.34 56.68 -100 56 C-99.34 56 -98.68 56 -98 56 C-97.67 55.01 -97.34 54.02 -97 53 C-95 50 -95 50 -92 49 C-91.26676204 46.98491642 -91.26676204 46.98491642 -91 45 C-90.01 45 -89.02 45 -88 45 C-87.9071875 44.071875 -87.9071875 44.071875 -87.8125 43.125 C-87 41 -87 41 -84.4375 39.75 C-83.633125 39.5025 -82.82875 39.255 -82 39 C-82 38.34 -82 37.68 -82 37 C-81.34 37 -80.68 37 -80 37 C-80 36.34 -80 35.68 -80 35 C-79.34 35 -78.68 35 -78 35 C-78 34.34 -78 33.68 -78 33 C-77.34 33 -76.68 33 -76 33 C-76 32.34 -76 31.68 -76 31 C-74.36209288 29.95355934 -72.68991979 28.9601817 -71 28 C-70.278125 27.443125 -69.55625 26.88625 -68.8125 26.3125 C-67 25 -67 25 -65 25 C-65 24.34 -65 23.68 -65 23 C-61.91190305 21.23537317 -60.76687864 21 -57 21 C-57 20.34 -57 19.68 -57 19 C-56.34 19 -55.68 19 -55 19 C-55 18.34 -55 17.68 -55 17 C-54.43410156 16.72285156 -53.86820313 16.44570313 -53.28515625 16.16015625 C-52.18494141 15.61681641 -52.18494141 15.61681641 -51.0625 15.0625 C-49.96615234 14.52302734 -49.96615234 14.52302734 -48.84765625 13.97265625 C-47.03750973 13.13628173 -47.03750973 13.13628173 -46 12 C-43.66702567 11.95907063 -41.33294775 11.95758277 -39 12 C-39 11.34 -39 10.68 -39 10 C-35.91111478 7.94074319 -35.29064073 7.7609626 -31.8125 7.875 C-30.554375 7.91625 -29.29625 7.9575 -28 8 C-28 7.34 -28 6.68 -28 6 C-26.68 6 -25.36 6 -24 6 C-24 5.34 -24 4.68 -24 4 C-18.72 4 -13.44 4 -8 4 C-8 3.34 -8 2.68 -8 2 C-5.36 1.67 -2.72 1.34 0 1 C0 0.67 0 0.34 0 0 Z " fill="#7A61FB" transform="translate(706,327)"/>
        </svg>
      </div>
      <div class="company-info">
        <div class="company-name">Tawaaq Fleet LLP</div>
        <div class="company-subtitle">drive with indias smartest fleet</div>
        <div class="company-phone">Phone: +91 9606393089</div>
      </div>
    </div>
    
    <div class="invoice-header">
      <h1>INVOICE</h1>
      <p>Bill Number: ${billData.billNumber}</p>
      <p>Date: ${invoiceDate}</p>
    </div>
    
    <div class="info-section">
      <div class="info-box">
        <h3>Driver Information</h3>
        <p>${billData.driverName}</p>
        <p style="font-size: 14px; font-weight: normal; margin-top: 4px;">TVP ID: ${
          billData.tvpId
        }</p>
      </div>
      <div class="info-box">
        <h3>Vehicle${billData.vehicles && billData.vehicles.length > 1 ? 's' : ''}</h3>
        <p>${billData.vehicleNumber || (billData.vehicles && billData.vehicles.map(v => v.vehicleNumber).join(', ')) || 'N/A'}</p>
      </div>
    </div>
    
    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${billData.vehicles && Array.isArray(billData.vehicles) && billData.vehicles.length > 0 ? `
        ${billData.vehicles.map((vehicle, idx) => {
          const vehicleRent = (Number(vehicle.dailyRent) || 0) * (Number(vehicle.rentalDays) || 0);
          return `
        <tr style="background: #f9fafb;">
          <td colspan="2" style="padding: 12px; font-weight: 600; border-bottom: 2px solid #e5e7eb;">
            Vehicle ${idx + 1}: ${vehicle.vehicleNumber || 'N/A'}
          </td>
        </tr>
        <tr>
          <td style="padding-left: 24px;">Rental Days</td>
          <td class="text-right">${vehicle.rentalDays || 0} days</td>
        </tr>
        <tr>
          <td style="padding-left: 24px;">Trips</td>
          <td class="text-right">${vehicle.trips || 0}</td>
        </tr>
        <tr>
          <td style="padding-left: 24px;">Daily Rent</td>
          <td class="text-right">₹${Number(vehicle.dailyRent || 0).toFixed(2)}</td>
        </tr>
        <tr style="background: #e0f2fe;">
          <td style="padding-left: 24px; font-weight: 600;">Vehicle Rent (₹${Number(vehicle.dailyRent || 0).toFixed(2)} × ${vehicle.rentalDays || 0} days)</td>
          <td class="text-right" style="font-weight: 600; color: #059669;">₹${vehicleRent.toFixed(2)}</td>
        </tr>
          `;
        }).join('')}
        ` : `
        <tr>
          <td>Rental Days: ${billData.rentalDays} days</td>
          <td class="text-right">-</td>
        </tr>
        <tr>
          <td>Total Trips: ${billData.trips}</td>
          <td class="text-right">-</td>
        </tr>
        `}
        ${hasValue(dailyRent) ? `
        <tr>
          <td>Daily Rent</td>
          <td class="text-right">${formatAmount(dailyRent)}</td>
        </tr>
        ` : ''}
        ${hasValue(weeklyInsurance) ? `
        <tr>
          <td>Weekly Insurance</td>
          <td class="text-right">${formatAmount(weeklyInsurance)}</td>
        </tr>
        ` : ''}
        ${hasValue(doubleDriverCharge) ? `
        <tr>
          <td>Double Driver Charge</td>
          <td class="text-right">${formatAmount(doubleDriverCharge)}</td>
        </tr>
        ` : ''}
        ${hasValue(netWeeklyRent) ? `
        <tr>
          <td class="text-bold">Net Weekly Rent</td>
          <td class="text-right text-bold">${formatAmount(netWeeklyRent)}</td>
        </tr>
        ` : ''}
        ${hasValue(totalEarnings) ? `
        <tr>
          <td class="text-bold">Total Earnings</td>
          <td class="text-right text-bold">${formatAmount(totalEarnings)}</td>
        </tr>
        ` : ''}
        ${hasValue(totalCashCollect) ? `
        <tr>
          <td>Total Cash Collect</td>
          <td class="text-right">${formatAmount(totalCashCollect)}</td>
        </tr>
        ` : ''}
        ${hasValue(platformFee) ? `
        <tr>
          <td>Driver Pass</td>
          <td class="text-right">${formatAmount(platformFee)}</td>
        </tr>
        ` : ''}
        ${hasValue(toll) ? `
        <tr>
          <td>Toll</td>
          <td class="text-right">${formatAmount(toll)}</td>
        </tr>
        ` : ''}
        ${hasValue(tds) ? `
        <tr>
          <td>TDS</td>
          <td class="text-right">${formatAmount(tds)}</td>
        </tr>
        ` : ''}
        ${hasValue(vehicleAdjustment) ? `
        <tr>
          <td>Vehicle Adjustment</td>
          <td class="text-right">${formatAmount(vehicleAdjustment)}</td>
        </tr>
        ` : ''}
        ${hasValue(rtoFine) ? `
        <tr>
          <td>RTO Fine</td>
          <td class="text-right">${formatAmount(rtoFine)}</td>
        </tr>
        ` : ''}
        ${hasValue(accident) ? `
        <tr>
          <td>Accident</td>
          <td class="text-right">${formatAmount(accident)}</td>
        </tr>
        ` : ''}
        ${hasValue(deadKm) ? `
        <tr>
          <td>Dead KM</td>
          <td class="text-right">${formatAmount(deadKm)}</td>
        </tr>
        ` : ''}
        ${hasValue(roomRent) ? `
        <tr>
          <td>Room Rent</td>
          <td class="text-right">${formatAmount(roomRent)}</td>
        </tr>
        ` : ''}
      </tbody>
    </table>
    
    <div class="total-section">
      <h3 style="margin-bottom: 15px; font-size: 16px; color: #333;">Calculation Summary</h3>
      ${billData.vehicles && Array.isArray(billData.vehicles) && billData.vehicles.length > 0 ? `
      ${billData.vehicles.map((vehicle, idx) => {
        const vehicleRent = (Number(vehicle.dailyRent) || 0) * (Number(vehicle.rentalDays) || 0);
        return `
      <div class="total-row" style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px;">
        <span style="font-weight: 600;">Vehicle ${idx + 1} (${vehicle.vehicleNumber || 'N/A'}):</span>
      </div>
      <div class="total-row" style="padding-left: 16px;">
        <span>Rental Days: ${vehicle.rentalDays || 0} days</span>
        <span>-</span>
      </div>
      <div class="total-row" style="padding-left: 16px;">
        <span>Trips: ${vehicle.trips || 0}</span>
        <span>-</span>
      </div>
      <div class="total-row" style="padding-left: 16px;">
        <span>Daily Rent: ₹${Number(vehicle.dailyRent || 0).toFixed(2)} × ${vehicle.rentalDays || 0} days</span>
        <span style="color: #059669; font-weight: 600;">₹${vehicleRent.toFixed(2)}</span>
      </div>
        `;
      }).join('')}
      <div class="total-row" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-weight: 600;">
        <span>Subtotal (All Vehicles):</span>
        <span style="color: #059669;">₹${billData.vehicles.reduce((sum, v) => sum + ((Number(v.dailyRent) || 0) * (Number(v.rentalDays) || 0)), 0).toFixed(2)}</span>
      </div>
      ` : hasValue(netWeeklyRent) ? `
      <div class="total-row">
        <span class="text-bold">Net Weekly Rent:</span>
        <span class="text-bold">${formatAmount(netWeeklyRent)} INR</span>
      </div>
      ` : ''}
      ${hasValue(roomRent) ? `
      <div class="total-row">
        <span>+ Room Rent:</span>
        <span style="color: #059669;">+${formatAmount(roomRent)} INR</span>
      </div>
      ` : ''}
      ${hasValue(toll) ? `
      <div class="total-row">
        <span>- Toll:</span>
        <span style="color: #dc2626;">-${formatAmount(toll)} INR</span>
      </div>
      ` : ''}
      ${hasValue(platformFee) ? `
      <div class="total-row">
        <span>+ Driver Pass:</span>
        <span style="color: #059669;">+${formatAmount(platformFee)} INR</span>
      </div>
      ` : ''}
      ${hasValue(tds) ? `
      <div class="total-row">
        <span>+ TDS:</span>
        <span style="color: #059669;">+${formatAmount(tds)} INR</span>
      </div>
      ` : ''}
      ${hasValue(vehicleAdjustment) ? `
      <div class="total-row">
        <span>- Vehicle Adjustment:</span>
        <span style="color: #dc2626;">-${formatAmount(vehicleAdjustment)} INR</span>
      </div>
      ` : ''}
      ${hasValue(rtoFine) ? `
      <div class="total-row">
        <span>+ RTO Fine:</span>
        <span style="color: #059669;">+${formatAmount(rtoFine)} INR</span>
      </div>
      ` : ''}
      ${hasValue(accident) ? `
      <div class="total-row">
        <span>+ Accident:</span>
        <span style="color: #059669;">+${formatAmount(accident)} INR</span>
      </div>
      ` : ''}
      ${hasValue(deadKm) ? `
      <div class="total-row">
        <span>+ Dead KM:</span>
        <span style="color: #059669;">+${formatAmount(deadKm)} INR</span>
      </div>
      ` : ''}
      ${hasValue(difference) ? `
      <div class="total-row">
        <span>${difference >= 0 ? '+' : ''} Difference:</span>
        <span style="color: ${difference >= 0 ? '#059669' : '#dc2626'};">${difference >= 0 ? '+' : ''}${formatAmount(Math.abs(difference))} INR</span>
      </div>
      ` : ''}
      ${hasValue(penaltyAmount) ? `
      <div class="total-row">
        <span>+ Penalty:</span>
        <span style="color: #059669;">+${formatAmount(penaltyAmount)} INR</span>
      </div>
      ` : ''}
      ${hasValue(penaltyOtherAmount) ? `
      <div class="total-row">
        <span>+ Other:</span>
        <span style="color: #059669;">+${formatAmount(penaltyOtherAmount)} INR</span>
      </div>
      ` : ''}
      ${hasValue(accidentPenaltyAmount) ? `
      <div class="total-row">
        <span>+ Accident penalty:</span>
        <span style="color: #059669;">+${formatAmount(accidentPenaltyAmount)} INR</span>
      </div>
      ` : ''}
      <div class="total-row final">
        <span>Final Amount (Current OS):</span>
        <span>${formatAmount(billData.currentOS || 0)} INR</span>
      </div>
    </div>
    
    <div class="footer">
      <p>This is a computer-generated invoice. No signature required.</p>
      <p>Generated on ${invoiceDate}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

// Generate multi-vehicle invoice HTML (for Hissab Generator)
export const generateMultiVehicleInvoiceHTML = (hissabData) => {
  const { owner, week, vehicles, otherCharges, totals } = hissabData;
  const invoiceDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate totals per vehicle for summary
  // Deductions: Toll, Vehicle Adjustment
  // Additions: Driver Pass, TDS, RTO, Accident, Dead KM, Difference
  const vehicleTotals = vehicles.map((vehicleData) => {
    const { billData } = vehicleData;
    return {
      netWeeklyRent: billData.netWeeklyRent || 0,
      deductions: (billData.toll || 0) + (billData.vehicleAdjustment || 0),
      additions:
        (billData.platformFee || 0) +
        (billData.tds || 0) +
        (billData.rtoFine || 0) +
        (billData.accident || 0) +
        (billData.deadKm || 0) +
        (billData.difference || 0),
      currentOS: billData.currentOS || 0,
    };
  });

  // Generate vehicle rows HTML - simplified with only key info
  const vehicleRowsHTML = vehicles
    .map((vehicleData, index) => {
      const { vehicle, billData } = vehicleData;
      const vehicleTotal = vehicleTotals[index];
      return `
      <tr style="background: #f9fafb;">
        <td colspan="2" style="padding: 12px; font-weight: 600; border-bottom: 2px solid #e5e7eb;">
          Vehicle ${index + 1}: ${vehicle?.car_number || "N/A"}
        </td>
      </tr>
      <tr>
        <td style="padding-left: 24px;">Rental Days</td>
        <td class="text-right">${billData.rentalDays || 0} days</td>
      </tr>
      <tr>
        <td style="padding-left: 24px;">Trips</td>
        <td class="text-right">${billData.trips || 0}</td>
      </tr>
      <tr>
        <td style="padding-left: 24px;">Daily Rent</td>
        <td class="text-right">₹${Number(billData.dailyRent || 0).toFixed(
          2
        )}</td>
      </tr>
      <tr>
        <td style="padding-left: 24px;">Weekly Insurance</td>
        <td class="text-right">₹${Number(billData.weeklyInsurance || 0).toFixed(
          2
        )}</td>
      </tr>
      ${
        billData.doubleDriverCharge > 0
          ? `
      <tr>
        <td style="padding-left: 24px;">Double Driver Charge</td>
        <td class="text-right" style="color: #059669;">+₹${Number(
          billData.doubleDriverCharge
        ).toFixed(2)}</td>
      </tr>
      `
          : ""
      }
      <tr style="background: #e0f2fe;">
        <td style="padding-left: 24px; font-weight: 600;">Net Weekly Rent</td>
        <td class="text-right" style="font-weight: 600; color: #059669;">+₹${Number(
          billData.netWeeklyRent || 0
        ).toFixed(2)}</td>
      </tr>
      ${
        billData.totalEarnings > 0 || billData.totalCashCollect > 0
          ? `
      <tr>
        <td style="padding-left: 24px;">Total Earnings</td>
        <td class="text-right">₹${Number(billData.totalEarnings || 0).toFixed(
          2
        )}</td>
      </tr>
      <tr>
        <td style="padding-left: 24px;">Total Cash Collect</td>
        <td class="text-right">₹${Number(
          billData.totalCashCollect || 0
        ).toFixed(2)}</td>
      </tr>
      <tr style="background: #fef3c7;">
        <td style="padding-left: 24px; font-weight: 600;">Difference (Cash Collect - Earnings)</td>
        <td class="text-right" style="font-weight: 600; color: ${
          (billData.difference || 0) >= 0 ? "#059669" : "#dc2626"
        };">
          ${(billData.difference || 0) >= 0 ? "+" : ""}₹${Number(
              billData.difference || 0
            ).toFixed(2)}
        </td>
      </tr>
      `
          : ""
      }
      ${
        billData.toll > 0
          ? `
      <tr>
        <td style="padding-left: 24px;">Toll (Refund)</td>
        <td class="text-right" style="color: #dc2626;">-₹${Number(
          billData.toll
        ).toFixed(2)}</td>
      </tr>
      `
          : ""
      }
      ${
        billData.platformFee > 0
          ? `
      <tr>
        <td style="padding-left: 24px;">Driver Pass</td>
        <td class="text-right" style="color: #059669;">+₹${Number(
          billData.platformFee
        ).toFixed(2)}</td>
      </tr>
      `
          : ""
      }
      ${
        billData.tds > 0
          ? `
      <tr>
        <td style="padding-left: 24px;">TDS (1% of Earnings)</td>
        <td class="text-right" style="color: #059669;">+₹${Number(
          billData.tds
        ).toFixed(2)}</td>
      </tr>
      `
          : ""
      }
      ${
        billData.vehicleAdjustment !== 0
          ? `
      <tr>
        <td style="padding-left: 24px;">Vehicle Adjustment</td>
        <td class="text-right" style="color: #dc2626;">-₹${Number(
          Math.abs(billData.vehicleAdjustment)
        ).toFixed(2)}</td>
      </tr>
      `
          : ""
      }
      ${
        billData.rtoFine > 0
          ? `
      <tr>
        <td style="padding-left: 24px;">RTO Fine</td>
        <td class="text-right" style="color: #059669;">+₹${Number(
          billData.rtoFine
        ).toFixed(2)}</td>
      </tr>
      `
          : ""
      }
      ${
        billData.accident > 0
          ? `
      <tr>
        <td style="padding-left: 24px;">Accident</td>
        <td class="text-right" style="color: #059669;">+₹${Number(
          billData.accident
        ).toFixed(2)}</td>
      </tr>
      `
          : ""
      }
      ${
        billData.deadKm > 0
          ? `
      <tr>
        <td style="padding-left: 24px;">Dead KM</td>
        <td class="text-right" style="color: #059669;">+₹${Number(
          billData.deadKm
        ).toFixed(2)}</td>
      </tr>
      `
          : ""
      }
      <tr style="background: #fef3c7; border-top: 2px solid #fbbf24;">
        <td style="padding-left: 24px; font-weight: 600;">Vehicle ${
          index + 1
        } Total</td>
        <td class="text-right" style="font-weight: 700; color: ${
          vehicleTotal.currentOS >= 0 ? "#059669" : "#dc2626"
        };">
          ${vehicleTotal.currentOS >= 0 ? "+" : ""}₹${Number(
        vehicleTotal.currentOS
      ).toFixed(2)}
        </td>
      </tr>
    `;
    })
    .join("");

  // Generate other charges rows HTML with colors
  const otherChargesRowsHTML = otherCharges
    .map((charge) => {
      const isAdd = charge.type === "+";
      return `
      <tr>
        <td style="padding: 10px;">${charge.description || "Other Charge"}</td>
        <td class="text-right" style="padding: 10px; font-weight: 600; color: ${
          isAdd ? "#059669" : "#dc2626"
        };">
          ${isAdd ? "+" : "-"}₹${Number(charge.amount || 0).toFixed(2)}
        </td>
      </tr>
    `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hissab Invoice - ${owner.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .invoice-container { max-width: 900px; margin: 0 auto; background: white; }
    .company-header { display: flex; align-items: center; gap: 20px; padding-bottom: 20px; margin-bottom: 20px; border-bottom: 3px solid #7A61FB; }
    .company-logo { width: 80px; height: 80px; flex-shrink: 0; }
    .company-logo svg { width: 100%; height: 100%; }
    .company-info { flex: 1; }
    .company-name { font-size: 28px; font-weight: 700; color: #7A61FB; margin-bottom: 4px; }
    .company-subtitle { font-size: 14px; color: #666; margin-bottom: 8px; font-style: italic; }
    .company-phone { font-size: 14px; color: #666; }
    .invoice-header { padding-bottom: 20px; margin-bottom: 30px; }
    .invoice-header h1 { color: #2563eb; font-size: 28px; margin-bottom: 10px; }
    .invoice-header p { color: #666; font-size: 14px; }
    .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .info-box h3 { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px; }
    .info-box p { font-size: 16px; font-weight: 600; color: #333; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .table th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    .table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .table tr:last-child td { border-bottom: none; }
    .text-right { text-align: right; }
    .text-bold { font-weight: 600; }
    .total-section { background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .total-row.final { font-size: 18px; font-weight: 700; color: #2563eb; padding-top: 10px; border-top: 2px solid #e5e7eb; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="company-header">
      <div class="company-logo">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" style="width: 100%; height: 100%;">
          <path d="M0 0 C6.27 0 12.54 0 19 0 C19 0.33 19 0.66 19 1 C24.28 1.33 29.56 1.66 35 2 C35 2.66 35 3.32 35 4 C42.59 4 50.18 4 58 4 C58 4.66 58 5.32 58 6 C60.64 6 63.28 6 66 6 C66 6.66 66 7.32 66 8 C70.62 8 75.24 8 80 8 C80 8.66 80 9.32 80 10 C80.804375 9.979375 81.60875 9.95875 82.4375 9.9375 C85 10 85 10 86 11 C87.53851559 11.15915679 89.08137761 11.27706625 90.625 11.375 C95.27307226 11.79094965 98.74635342 13.03071918 103 15 C105.01079595 15.57451313 107.02951182 16.05484777 109.06640625 16.52734375 C111.76785095 17.1876969 114.3768326 18.08189141 117 19 C117 19.66 117 20.32 117 21 C118.32 21 119.64 21 121 21 C121 21.66 121 22.32 121 23 C122.258125 22.938125 123.51625 22.87625 124.8125 22.8125 C128.78986165 22.79861741 128.78986165 22.79861741 130.5 24.4375 C130.995 24.953125 131.49 25.46875 132 26 C133.92391648 26.31266405 133.92391648 26.31266405 136.0625 26.4375 C137.361875 26.623125 138.66125 26.80875 140 27 C141.5 29.0625 141.5 29.0625 142 31 C144.01822917 30.90234375 146.03645833 30.8046875 148.0546875 30.70703125 C148.69664062 30.80371094 149.33859375 30.90039062 150 31 C150.99 32.485 150.99 32.485 152 34 C152.99 34.144375 153.98 34.28875 155 34.4375 C156.485 34.7159375 156.485 34.7159375 158 35 C159.375 37.0625 159.375 37.0625 160 39 C161.98 39 163.96 39 166 39 C166 39.66 166 40.32 166 41 C168.88213522 42.04291154 168.88213522 42.04291154 171.5 42.4375 C174 43 174 43 177 45 C177 45.66 177 46.32 177 47 C177.53625 47.103125 178.0725 47.20625 178.625 47.3125 C181.62502044 48.18092697 184.2379535 49.55620296 187 51 C187 51.66 187 52.32 187 53 C189.97 53.495 189.97 53.495 193 54 C193 54.99 193 55.98 193 57 C194.32 57 195.64 57 197 57 C197 57.66 197 58.32 197 59 C199.65228812 60.07525194 202.28368454 61.09456151 205 62 C205 62.66 205 63.32 205 64 C205.66 64 206.32 64 207 64 C207 64.66 207 65.32 207 66 C207.639375 66.103125 208.27875 66.20625 208.9375 66.3125 C209.618125 66.539375 210.29875 66.76625 211 67 C211.33 67.99 211.66 68.98 212 70 C213.32 70 214.64 70 216 70 C216 70.66 216 71.32 216 72 C216.66 72 217.32 72 218 72 C218 72.66 218 73.32 218 74 C218.61875 74.144375 219.2375 74.28875 219.875 74.4375 C222 75 222 75 224 76 C224 76.66 224 77.32 224 78 C224.66 78 225.32 78 226 78 C226 78.66 226 79.32 226 80 C226.66 80 227.32 80 228 80 C228 80.66 228 81.32 228 82 C228.66 82 229.32 82 230 82 C230 82.66 230 83.32 230 84 C231.32 84 232.64 84 234 84 C234 84.66 234 85.32 234 86 C234.66 86 235.32 86 236 86 C236 86.66 236 87.32 236 88 C236.66 88 237.32 88 238 88 C238 88.66 238 89.32 238 90 C238.66 90 239.32 90 240 90 C240 90.66 240 91.32 240 92 C241.32 92 242.64 92 244 92 C244 92.66 244 93.32 244 94 C244.66 94 245.32 94 246 94 C246 94.66 246 95.32 246 96 C246.66 96 247.32 96 248 96 C248 96.66 248 97.32 248 98 C248.598125 98.268125 249.19625 98.53625 249.8125 98.8125 C251.99847854 99.99917406 253.41332594 101.09599113 255 103 C255 103.66 255 104.32 255 105 C255.66 105 256.32 105 257 105 C257 105.66 257 106.32 257 107 C257.66 107 258.32 107 259 107 C259 107.66 259 108.32 259 109 C260.32 109.66 261.64 110.32 263 111 C263 111.66 263 112.32 263 113 C263.66 113 264.32 113 265 113 C265 113.66 265 114.32 265 115 C265.66 115 266.32 115 267 115 C267 115.66 267 116.32 267 117 C267.66 117 268.32 117 269 117 C269 117.66 269 118.32 269 119 C269.66 119 270.32 119 271 119 C271 119.66 271 120.32 271 121 C271.66 121 272.32 121 273 121 C273 122.32 273 123.64 273 125 C274.32 125 275.64 125 277 125 C277 126.32 277 127.64 277 129 C277.66 129 278.32 129 279 129 C279 129.66 279 130.32 279 131 C279.66 131 280.32 131 281 131 C283.125 132.75 283.125 132.75 285 135 C285 136.32 285 137.64 285 139 C285.66 139 286.32 139 287 139 C287 139.66 287 140.32 287 141 C287.66 141 288.32 141 289 141 C289 141.66 289 142.32 289 143 C289.66 143 290.32 143 291 143 C294 147.38461538 294 147.38461538 294 150 C294.66 150 295.32 150 296 150 C296 151.32 296 152.64 296 154 C297.32 154 298.64 154 300 154 C300 155.32 300 156.64 300 158 C300.66 158 301.32 158 302 158 C302 158.66 302 159.32 302 160 C302.66 160 303.32 160 304 160 C304 161.32 304 162.64 304 164 C304.66 164 305.32 164 306 164 C306 164.66 306 165.32 306 166 C306.66 166 307.32 166 308 166 C308 167.98 308 169.96 308 172 C309.32 172 310.64 172 312 172 C312.144375 172.763125 312.28875 173.52625 312.4375 174.3125 C312.9632594 177.08172908 312.9632594 177.08172908 314 180 C314.66 180 315.32 180 316 180 C317.4606285 182.64738916 318 183.89448334 318 187 C318.66 187 319.32 187 320 187 C320 188.32 320 189.64 320 191 C320.66 191 321.32 191 322 191 C322 192.32 322 193.64 322 195 C322.66 195 323.32 195 324 195 C324 196.32 324 197.64 324 199 C324.66 199 325.32 199 326 199 C326 200.32 326 201.64 326 203 C326.66 203 327.32 203 328 203 C328 204.32 328 205.64 328 207 C328.66 207 329.32 207 330 207 C330 208.32 330 209.64 330 211 C330.66 211 331.32 211 332 211 C332 212.32 332 213.64 332 215 C332.99 215.33 333.98 215.66 335 216 C335.73080266 217.97746603 336.39421747 219.98072489 337 222 C337.66 222.99 338.32 223.98 339 225 C339.56120851 226.5064018 340.07998972 228.02907729 340.5625 229.5625 C341.27618593 231.81449343 341.94322352 233.88644704 343 236 C343.039992 237.99960012 343.04346799 240.00047242 343 242 C343.66 242 344.32 242 345 242 C345 243.32 345 244.64 345 246 C345.66 246 346.32 246 347 246 C347 247.98 347 249.96 347 252 C347.66 252 348.32 252 349 252 C349 254.31 349 256.62 349 259 C349.66 259 350.32 259 351 259 C351 260.98 351 262.96 351 265 C351.66 265 352.32 265 353 265 C353 268.3 353 271.6 353 275 C353.66 275 354.32 275 355 275 C357.37590142 278.70416126 357.20500286 281.92984573 357.125 286.25 C357.10695313 287.51328125 357.08890625 288.7765625 357.0703125 290.078125 C357.03550781 291.52445313 357.03550781 291.52445313 357 293 C357.66 293 358.32 293 359 293 C359.33 294.98 359.66 296.96 360 299 C360.33 299 360.66 299 361 299 C361 305.27 361 311.54 361 318 C361.66 318 362.32 318 363 318 C363.33 320.64 363.66 323.28 364 326 C364.33 326 364.66 326 365 326 C365 340.52 365 355.04 365 370 C318.8 370 272.6 370 225 370 C223.33278054 366.66556107 223.86740858 362.9215049 223.87974548 359.25558472 C223.87846146 357.88427399 223.87846146 357.88427399 223.87715149 356.48526001 C223.87548833 353.39363696 223.88103282 350.30206736 223.88647461 347.21044922 C223.88678075 344.96744857 223.88664779 342.72444782 223.88610935 340.48144722 C223.88588292 334.45656154 223.89169284 328.43169559 223.89871979 322.40681458 C223.90440061 316.76022273 223.90468214 311.11363577 223.90539551 305.46704102 C223.91064984 288.93635805 223.92461089 272.40567878 223.9375 255.875 C223.958125 218.95625 223.97875 182.0375 224 144 C112.625 143.505 112.625 143.505 -1 143 C-1.020625 119.961875 -1.04125 96.92375 -1.0625 73.1875 C-1.071604 65.90582764 -1.08070801 58.62415527 -1.09008789 51.12182617 C-1.09460449 42.24865723 -1.09460449 42.24865723 -1.09544373 38.0983429 C-1.09637758 35.19180034 -1.10013386 32.28527595 -1.10557556 29.3787384 C-1.11241907 25.67457226 -1.11449403 21.97043263 -1.11307228 18.26626074 C-1.11351035 16.26096762 -1.11888188 14.25567746 -1.12442875 12.25039196 C-1.12305125 11.07074525 -1.12167376 9.89109854 -1.12025452 8.67570496 C-1.12117631 7.64606219 -1.1220981 6.61641943 -1.12304783 5.55557537 C-1 3 -1 3 0 0 Z " fill="#7A61FB" transform="translate(217,327)"/>
          <path d="M0 0 C33.33 0 66.66 0 101 0 C102.31805799 2.63611598 102.12590187 4.59552715 102.12698364 7.54872131 C102.12980347 8.72800705 102.13262329 9.90729279 102.13552856 11.12231445 C102.13249222 13.07282715 102.13249222 13.07282715 102.12939453 15.06274414 C102.13074897 16.4407099 102.13252915 17.8186753 102.13470459 19.19664001 C102.13927338 22.94441208 102.13749174 26.69215669 102.1343255 30.43992925 C102.13179956 34.35525288 102.13414005 38.27057411 102.13571167 42.18589783 C102.13753246 48.76073632 102.13512919 55.3355636 102.13037109 61.91040039 C102.12492639 69.52213027 102.12669301 77.13383338 102.1321975 84.74556261 C102.1367285 91.2712569 102.13737931 97.7969431 102.13475883 104.32263845 C102.13319627 108.22442053 102.13300175 112.12618999 102.13629532 116.02797127 C102.13917392 119.69441933 102.13719856 123.3608327 102.13140106 127.02727699 C102.12943788 129.02258887 102.13242731 131.01790367 102.13552856 133.01321411 C102.13270874 134.18968002 102.12988892 135.36614594 102.12698364 136.57826233 C102.1264181 138.1215954 102.1264181 138.1215954 102.12584114 139.69610691 C102 142 102 142 101 143 C98.06695272 143.09797065 95.15744612 143.12991804 92.22398376 143.12025452 C90.82612722 143.12153615 90.82612722 143.12153615 89.40003115 143.12284368 C86.25226407 143.12450134 83.10454934 143.11897247 79.95678711 143.11352539 C77.71036277 143.11324355 75.46393833 143.11340118 73.21751404 143.1139679 C67.09792571 143.11425601 60.97835679 143.10835706 54.85877299 143.10139394 C48.47124373 143.09516269 42.08371408 143.09455678 35.69618225 143.09336853 C24.96826781 143.09060882 14.24036189 143.08435329 3.51245117 143.07543945 C-7.53930628 143.06626606 -18.59106178 143.05918487 -29.64282227 143.05493164 C-30.32359453 143.05466892 -31.0043668 143.05440619 -31.70576853 143.05413551 C-35.12086613 143.05283051 -38.53596375 143.05156679 -41.95106137 143.05032361 C-70.30071251 143.03995012 -98.65035587 143.02225692 -127 143 C-129.41160888 135.76517335 -128.55809062 126.44421076 -127 119 C-126.505 118.505 -126.505 118.505 -126 118 C-125.65458149 115.66842508 -125.32205743 113.33491639 -125 111 C-124.67 110.01 -124.34 109.02 -124 108 C-123.64456573 105.66993089 -123.3086247 103.33672984 -123 101 C-122.34 101 -121.68 101 -121 101 C-121 99.35 -121 97.7 -121 96 C-120.67 96 -120.34 96 -120 96 C-119.67 93.36 -119.34 90.72 -119 88 C-118.34 88 -117.68 88 -117 88 C-116.855625 87.4225 -116.71125 86.845 -116.5625 86.25 C-116.04166667 84.16666667 -115.52083333 82.08333333 -115 80 C-114.34 80 -113.68 80 -113 80 C-113 78.68 -113 77.36 -113 76 C-112.34 76 -111.68 76 -111 76 C-110.87625 75.05125 -110.7525 74.1025 -110.625 73.125 C-110 70 -110 70 -108 68 C-107.67 67.34 -107.34 66.68 -107 66 C-106.01 66 -105.02 66 -104 66 C-104.2475 65.4225 -104.495 64.845 -104.75 64.25 C-104.87375 63.13625 -104.87375 63.13625 -105 62 C-103.125 59.875 -103.125 59.875 -101 58 C-100.67 57.34 -100.34 56.68 -100 56 C-99.34 56 -98.68 56 -98 56 C-97.67 55.01 -97.34 54.02 -97 53 C-95 50 -95 50 -92 49 C-91.26676204 46.98491642 -91.26676204 46.98491642 -91 45 C-90.01 45 -89.02 45 -88 45 C-87.9071875 44.071875 -87.9071875 44.071875 -87.8125 43.125 C-87 41 -87 41 -84.4375 39.75 C-83.633125 39.5025 -82.82875 39.255 -82 39 C-82 38.34 -82 37.68 -82 37 C-81.34 37 -80.68 37 -80 37 C-80 36.34 -80 35.68 -80 35 C-79.34 35 -78.68 35 -78 35 C-78 34.34 -78 33.68 -78 33 C-77.34 33 -76.68 33 -76 33 C-76 32.34 -76 31.68 -76 31 C-74.36209288 29.95355934 -72.68991979 28.9601817 -71 28 C-70.278125 27.443125 -69.55625 26.88625 -68.8125 26.3125 C-67 25 -67 25 -65 25 C-65 24.34 -65 23.68 -65 23 C-61.91190305 21.23537317 -60.76687864 21 -57 21 C-57 20.34 -57 19.68 -57 19 C-56.34 19 -55.68 19 -55 19 C-55 18.34 -55 17.68 -55 17 C-54.43410156 16.72285156 -53.86820313 16.44570313 -53.28515625 16.16015625 C-52.18494141 15.61681641 -52.18494141 15.61681641 -51.0625 15.0625 C-49.96615234 14.52302734 -49.96615234 14.52302734 -48.84765625 13.97265625 C-47.03750973 13.13628173 -47.03750973 13.13628173 -46 12 C-43.66702567 11.95907063 -41.33294775 11.95758277 -39 12 C-39 11.34 -39 10.68 -39 10 C-35.91111478 7.94074319 -35.29064073 7.7609626 -31.8125 7.875 C-30.554375 7.91625 -29.29625 7.9575 -28 8 C-28 7.34 -28 6.68 -28 6 C-26.68 6 -25.36 6 -24 6 C-24 5.34 -24 4.68 -24 4 C-18.72 4 -13.44 4 -8 4 C-8 3.34 -8 2.68 -8 2 C-5.36 1.67 -2.72 1.34 0 1 C0 0.67 0 0.34 0 0 Z " fill="#7A61FB" transform="translate(706,327)"/>
        </svg>
      </div>
      <div class="company-info">
        <div class="company-name">Tawaaq Fleet LLP</div>
        <div class="company-subtitle">drive with indias smartest fleet</div>
        <div class="company-phone">Phone: +91 9606393089</div>
      </div>
    </div>
    
    <div class="invoice-header">
      <h1>HISSAB INVOICE</h1>
      <p>Week: ${formatDate(week.weekStart)} - ${formatDate(week.weekEnd)}</p>
      <p>Date: ${invoiceDate}</p>
    </div>
    
    <div class="info-section">
      <div class="info-box">
        <h3>TVP Owner Information</h3>
        <p>${owner.name}</p>
        <p style="font-size: 14px; font-weight: normal; margin-top: 4px;">TVP ID: ${
          owner.tvpId
        }</p>
      </div>
      <div class="info-box">
        <h3>Vehicles</h3>
        <p>${vehicles.length} vehicle(s)</p>
        <p style="font-size: 14px; font-weight: normal; margin-top: 4px;">${vehicles
          .map((v) => v.vehicle?.car_number)
          .filter(Boolean)
          .join(", ")}</p>
      </div>
    </div>
    
    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${vehicleRowsHTML}
        ${
          otherCharges.length > 0
            ? `
          <tr style="background: #f3f4f6;">
            <td colspan="2" style="padding: 12px; font-weight: 600; border-bottom: 2px solid #e5e7eb;">
              Other Charges
            </td>
          </tr>
          ${otherChargesRowsHTML}
        `
            : ""
        }
      </tbody>
    </table>
    
    <!-- Vehicle Totals Summary -->
    <div class="vehicle-summary">
      <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 15px; color: #92400e;">Total Vehicle Amounts</h3>
      <div class="total-row">
        <span style="font-weight: 600;">Total Net Rent (All Vehicles):</span>
        <span style="font-weight: 700; color: #059669; font-size: 16px;">+₹${totals.totalNetRent.toFixed(
          2
        )}</span>
      </div>
      <div class="total-row">
        <span style="font-weight: 600;">Total Deductions:</span>
        <span style="font-weight: 700; color: #dc2626; font-size: 16px;">-₹${totals.totalDeductions.toFixed(
          2
        )}</span>
      </div>
      <div class="total-row">
        <span style="font-weight: 600;">Total Additions:</span>
        <span style="font-weight: 700; color: #059669; font-size: 16px;">+₹${totals.totalAdditions.toFixed(
          2
        )}</span>
      </div>
      <div class="total-row" style="border-top: 2px solid #fbbf24; padding-top: 10px; margin-top: 10px;">
        <span style="font-weight: 700; font-size: 16px;">Total from All Vehicles:</span>
        <span style="font-weight: 700; font-size: 18px; color: ${
          totals.totalNetRent +
            totals.totalAdditions -
            totals.totalDeductions >=
          0
            ? "#059669"
            : "#dc2626"
        };">
          ${
            totals.totalNetRent +
              totals.totalAdditions -
              totals.totalDeductions >=
            0
              ? "+"
              : ""
          }₹${(
    totals.totalNetRent +
    totals.totalAdditions -
    totals.totalDeductions
  ).toFixed(2)}
        </span>
      </div>
    </div>
    
    <!-- Other Charges Section -->
    ${
      otherCharges.length > 0
        ? `
    <div class="other-charges-section">
      <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 15px; color: #374151;">Other Charges</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #d1d5db;">Description</th>
            <th style="text-align: right; padding: 8px; border-bottom: 1px solid #d1d5db;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${otherChargesRowsHTML}
        </tbody>
      </table>
      <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #d1d5db;">
        <div class="total-row">
          <span style="font-weight: 600;">Total Other Charges:</span>
          <span style="font-weight: 700; font-size: 16px; color: ${
            totals.totalOtherCharges >= 0 ? "#059669" : "#dc2626"
          };">
            ${
              totals.totalOtherCharges >= 0 ? "+" : ""
            }₹${totals.totalOtherCharges.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
    `
        : ""
    }
    
    <!-- Final Amount -->
    <div class="total-section" style="background: #dbeafe; border: 3px solid #2563eb;">
      ${
        totals.penaltyAmount > 0
          ? `
      <div class="total-row">
        <span style="font-weight: 600;">+ Penalty:</span>
        <span style="font-weight: 700; color: #059669;">+₹${Number(totals.penaltyAmount || 0).toFixed(2)}</span>
      </div>
      `
          : ""
      }
      ${
        totals.penaltyOtherAmount > 0
          ? `
      <div class="total-row">
        <span style="font-weight: 600;">+ Other:</span>
        <span style="font-weight: 700; color: #059669;">+₹${Number(totals.penaltyOtherAmount || 0).toFixed(2)}</span>
      </div>
      `
          : ""
      }
      <div class="total-row final" style="color: #1e40af;">
        <span style="font-size: 22px; font-weight: 700;">FINAL AMOUNT:</span>
        <span style="font-size: 24px; font-weight: 700; color: ${
          totals.finalAmount >= 0 ? "#059669" : "#dc2626"
        };">
          ${totals.finalAmount >= 0 ? "+" : ""}₹${totals.finalAmount.toFixed(2)}
        </span>
      </div>
    </div>
    
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>Generated on ${invoiceDate}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};
