/**
 * Parse CSV file and extract bill data
 * @param {File} file - CSV file to parse
 * @returns {Promise<Array>} - Array of extracted bill objects
 */

/**
 * Parse a number string that may contain commas (e.g., "3,150" → 3150)
 * @param {string} value - String value to parse
 * @returns {number} - Parsed number
 */
const parseNumber = (value) => {
  if (!value || value === "" || value === "-") return 0;
  // Remove commas and parse
  const cleaned = String(value).replace(/,/g, "").trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Parse CSV text into rows
 * @param {string} csvText - CSV file content
 * @returns {Array<Array<string>>} - Array of rows, each row is an array of cells
 */
const parseCSVText = (csvText) => {
  const rows = [];
  const lines = csvText.split(/\r?\n/);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parsing - handle quoted values
    const cells = [];
    let currentCell = "";
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(currentCell.trim());
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
    
    // Add the last cell
    cells.push(currentCell.trim());
    rows.push(cells);
  }
  
  return rows;
};

/**
 * Extract bill data from CSV rows
 * @param {Array<Array<string>>} rows - Parsed CSV rows
 * @returns {Array} - Array of bill objects
 */
const extractBillsFromCSV = (rows) => {
  const bills = [];
  
  // Skip header rows (first 2 rows are usually headers/empty)
  // Start from row index 2 (0-indexed, so rows[2] is the 3rd row)
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    
    // Skip empty rows or rows that are totals
    if (row.length < 3 || !row[2] || row[2].trim() === "" || row[0]?.toLowerCase().includes("total")) {
      continue;
    }
    
    // Extract data based on column positions
    // Column B (index 1): Date of allocation
    // Column C (index 2): Vehicle Number
    // Column D (index 3): Vendor Name
    // Column J (index 9): Net Weekly Lease Rental
    // Column W (index 22): Total Earning
    // Column X (index 23): Uber Cash Collection
    // Column Y (index 24): Toll
    // Column AD (index 29): TDS
    // Column AF (index 31): Accident
    // Column AG (index 32): DeadMile
    // Column AH (index 33): Current O/S
    
    // Ensure row has enough columns
    if (row.length < 3) continue;
    
    const vehicleNumber = (row[2] || "").trim();
    if (!vehicleNumber) continue; // Skip rows without vehicle number
    
    const dateOfAllocation = (row[1] || "").trim();
    const vendorName = (row[3] || "").trim();
    const netWeeklyRent = parseNumber(row[9] || "0");
    const totalEarnings = parseNumber(row[22] || "0");
    const totalCashCollect = parseNumber(row[23] || "0"); // Can be negative
    const toll = parseNumber(row[24] || "0");
    const tds = parseNumber(row[29] || "0");
    const accident = parseNumber(row[31] || "0");
    const deadKm = parseNumber(row[32] || "0");
    const currentOS = parseNumber(row[33] || "0");
    
    // Calculate difference (Earnings - Cash Collect)
    const difference = totalEarnings - totalCashCollect;
    
    // Calculate rental days from date (if available) or default to 7
    // For now, we'll use 7 as default since we need week selector
    const rentalDays = 7;
    
    // Extract daily rent from Net Weekly Rent / rental days
    const dailyRent = rentalDays > 0 ? netWeeklyRent / rentalDays : 0;
    
    bills.push({
      vehicleNumber,
      dateOfAllocation,
      vendorName,
      rentalDays,
      dailyRent,
      netWeeklyRent,
      totalEarnings,
      totalCashCollect,
      difference,
      toll,
      tds,
      accident,
      deadKm,
      currentOS,
      // Additional fields that might be in CSV but not directly mapped
      weeklyInsurance: 210, // Default value
      doubleDriverCharge: 0, // Not in CSV, will be calculated based on category
      platformFee: 0, // Driver Pass - not directly in CSV
      vehicleAdjustment: 0, // Vehicle Level Adjustment - might be in different column
      rtoFine: 0, // Challan - not in CSV
      trips: 0, // Not directly in CSV, might need to be calculated or set manually
    });
  }
  
  return bills;
};

/**
 * Parse CSV file and extract bill data
 * @param {File} file - CSV file to parse
 * @returns {Promise<Array>} - Array of extracted bill objects
 */
export const parseCSVBills = async (file) => {
  try {
    console.log('Reading CSV file:', file.name, 'size:', file.size);
    
    // Read file as text
    const csvText = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read CSV file'));
      reader.readAsText(file);
    });
    
    console.log('CSV text read, length:', csvText.length);
    console.log('First 500 characters:', csvText.substring(0, 500));
    
    // Parse CSV text into rows
    const rows = parseCSVText(csvText);
    console.log('Parsed CSV rows:', rows.length);
    
    // Extract bill data
    const bills = extractBillsFromCSV(rows);
    console.log('Extracted bills count:', bills.length);
    
    if (bills.length === 0) {
      throw new Error('No bill data found in CSV. Please check the CSV format.');
    }
    
    return bills;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw new Error(`CSV parsing failed: ${error.message}`);
  }
};
