import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for pdfjs-dist
// Use CDN for worker (most reliable cross-browser approach)
if (typeof window !== 'undefined') {
  // Use unpkg CDN which hosts pdfjs-dist workers
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
}

/**
 * Extract text from a PDF file
 * @param {File} file - PDF file to parse
 * @returns {Promise<string>} - Extracted text from PDF
 */
export const extractTextFromPDF = async (file) => {
  try {
    console.log('Reading PDF file:', file.name, 'size:', file.size);
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
    
    console.log('Loading PDF document...');
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0, // Reduce console output
    }).promise;
    
    console.log('PDF loaded, pages:', pdf.numPages);
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Extracting text from page ${pageNum}...`);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    console.log('Text extraction complete, total length:', fullText.length);
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

/**
 * Normalize vehicle number for matching
 * @param {string} vehicleNumber - Vehicle number to normalize
 * @returns {string} - Normalized vehicle number
 */
export const normalizeVehicleNumber = (vehicleNumber) => {
  if (!vehicleNumber) return '';
  return vehicleNumber
    .toUpperCase()
    .replace(/\s+/g, '') // Remove spaces
    .replace(/-/g, '') // Remove dashes
    .trim();
};

/**
 * Parse table row data
 * @param {string} rowText - Text representing a table row
 * @param {Array} columnHeaders - Array of column header names
 * @returns {Object|null} - Parsed row data or null if invalid
 */
const parseTableRow = (rowText, columnHeaders) => {
  // Split by multiple spaces or tabs (table delimiter)
  const cells = rowText.split(/\s{2,}|\t/).filter(cell => cell.trim().length > 0);
  
  if (cells.length < columnHeaders.length) {
    return null;
  }

  const rowData = {};
  columnHeaders.forEach((header, index) => {
    rowData[header] = cells[index]?.trim() || '';
  });

  return rowData;
};

/**
 * Extract bill data from PDF text - handles table-structured PDFs
 * @param {string} pdfText - Text extracted from PDF
 * @returns {Array} - Array of extracted bill objects
 */
export const extractBillDataFromText = (pdfText) => {
  const bills = [];
  
  // Try to detect table structure
  // Look for common table header patterns
  const tableHeaderPatterns = [
    /Car\s+No|Car\s+Number|Vehicle\s+Number/i,
    /Driver|Driver\s+Name/i,
    /Trips/i,
    /Total\s+earnings|Total\s+Earnings/i,
    /Cash\s+collect|Payouts/i,
    /Toll/i,
  ];

  const hasTableStructure = tableHeaderPatterns.some(pattern => pattern.test(pdfText));
  
  if (hasTableStructure) {
    // Parse table-structured PDF
    return extractBillsFromTable(pdfText);
  } else {
    // Fall back to simple pattern matching (original approach)
    return extractBillsFromText(pdfText);
  }
};

/**
 * Extract bills from table-structured PDF
 * @param {string} pdfText - Text extracted from PDF
 * @returns {Array} - Array of extracted bill objects
 */
const extractBillsFromTable = (pdfText) => {
  const bills = [];
  
  // Split into lines
  const lines = pdfText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Find all vehicle numbers in the text (Indian format: KA03AQ8211, KA05AP7650, etc.)
  // Pattern: 2 letters, 2 digits, 1-3 letters, 4 digits
  const vehicleNumberPattern = /\b([A-Z]{2}\d{2}[A-Z]{1,3}\d{4})\b/g;
  
  // Find all vehicle numbers and their positions
  const vehicleMatches = [];
  lines.forEach((line, lineIndex) => {
    let match;
    while ((match = vehicleNumberPattern.exec(line)) !== null) {
      vehicleMatches.push({
        vehicleNumber: normalizeVehicleNumber(match[1]),
        lineIndex,
        line,
        position: match.index,
      });
    }
  });

  if (vehicleMatches.length === 0) {
    // No vehicle numbers found, try fallback
    return extractBillsFromText(pdfText);
  }

  // Process each row that contains a vehicle number
  vehicleMatches.forEach(({ vehicleNumber, lineIndex, line }) => {
    try {
      // Split the line by whitespace to get potential fields
      // PDF text extraction often loses column alignment, so we need to be smart
      const parts = line.split(/\s+/).filter(part => part.trim().length > 0);
      
      // Try to identify data positions
      // Look for UUID pattern (8-4-4-4-12 hex digits)
      const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
      const uuidIndex = parts.findIndex(part => uuidPattern.test(part));
      
      // Extract driver name (text fields before vehicle number or after vendor code)
      let driverName = '';
      const nameParts = [];
      
      // Find parts that look like names (capital letters, reasonable length, no numbers)
      // Create a non-global pattern for testing
      const vehicleNumberTestPattern = /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/;
      
      parts.forEach((part, idx) => {
        // Skip vendor codes, UUIDs, vehicle numbers, and numeric values
        if (uuidPattern.test(part)) return;
        if (vehicleNumberTestPattern.test(part)) return;
        if (/^[\d.,\-]+$/.test(part)) return; // Pure numbers
        
        // Look for text that could be a name (starts with capital, reasonable length)
        if (/^[A-Z][a-z]+$/.test(part) && part.length >= 2 && part.length <= 30) {
          // Skip common non-name words
          if (!/^(CV|SHUHAIB|LETZBLRIP|Vendor|Code|Name|Type|Model)$/i.test(part)) {
            nameParts.push(part);
          }
        }
      });
      
      driverName = nameParts.slice(0, 3).join(' ').trim(); // Take first 3 name parts
      
      // Extract numeric values (remove commas, handle negative values)
      const numericParts = parts.map(part => {
        // Handle negative numbers (e.g., "-4344.91")
        const cleaned = part.replace(/,/g, '').trim();
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      }).filter(num => num !== null);

      // Based on the sample data structure:
      // Vendor Code | Vendor Name | Car No | Driver | UUID | Driver first name | Driver surname | 
      // Trips | Total earnings | Payouts : Cash collector | Toll | Driver subscription charge | Final
      
      // After UUID, we typically have: driver first name, driver surname, then numeric values
      // The numeric values usually start with trips, then earnings, cash collect, toll, platform fee
      
      // Find where numeric values start (after driver name fields)
      let numericStartIndex = -1;
      for (let i = uuidIndex + 1; i < parts.length; i++) {
        const num = parseFloat(parts[i].replace(/,/g, ''));
        if (!isNaN(num)) {
          numericStartIndex = i;
          break;
        }
      }

      if (numericStartIndex === -1) {
        // Can't find numeric data, skip this row
        return;
      }

      // Extract values by position (approximate)
      // Usually: trips, total earnings, cash collect, toll, platform fee
      const trips = numericParts[0] !== undefined ? Math.abs(Math.round(numericParts[0])) : 0;
      const totalEarnings = numericParts[1] !== undefined ? Math.abs(numericParts[1]) : 0;
      const totalCashCollect = numericParts[2] !== undefined ? Math.abs(numericParts[2]) : 0;
      const toll = numericParts[3] !== undefined ? Math.abs(numericParts[3]) : 0;
      const platformFee = numericParts[4] !== undefined ? Math.abs(numericParts[4]) : 0;

      // If we have more numeric values, try to identify them
      // Sometimes the order might be different, so we look for patterns
      let foundTrips = trips;
      let foundEarnings = totalEarnings;
      let foundCashCollect = totalCashCollect;
      let foundToll = toll;
      let foundPlatformFee = platformFee;

      // Try to find values by size/pattern heuristics
      numericParts.forEach((num, idx) => {
        const absNum = Math.abs(num);
        // Trips are usually small integers (0-200)
        if (absNum < 200 && Number.isInteger(absNum) && foundTrips === 0) {
          foundTrips = absNum;
        }
        // Earnings are usually larger (thousands)
        if (absNum > 100 && foundEarnings === 0) {
          foundEarnings = absNum;
        }
        // Cash collect is usually close to earnings but slightly less
        if (absNum > 100 && absNum < foundEarnings * 1.2 && foundCashCollect === 0 && idx > 0) {
          foundCashCollect = absNum;
        }
        // Toll is usually smaller (hundreds to low thousands)
        if (absNum > 0 && absNum < 5000 && foundToll === 0) {
          foundToll = absNum;
        }
        // Platform fee can vary but usually hundreds to thousands
        if (absNum > 100 && absNum < 10000 && idx >= 4) {
          foundPlatformFee = absNum;
        }
      });

      // Use found values or defaults
      const finalTrips = foundTrips || trips;
      const finalEarnings = foundEarnings || totalEarnings;
      const finalCashCollect = foundCashCollect || totalCashCollect;
      const finalToll = foundToll || toll;
      const finalPlatformFee = foundPlatformFee || platformFee;

      // Default values for missing fields
      const rentalDays = 7; // Default to weekly
      const dailyRent = finalTrips > 0 ? Math.round(finalEarnings / finalTrips) : 0; // Estimate from trips
      const weeklyInsurance = 210; // Default
      const doubleDriverCharge = 0; // Not in the PDF
      const tds = 0; // Not in the PDF
      const vehicleAdjustment = 0; // Not in the PDF
      const rtoFine = 0; // Not in the PDF
      const accident = 0; // Not in the PDF
      const deadKm = 0; // Not in the PDF

      // Calculate derived fields
      const netWeeklyRent = (dailyRent * rentalDays) + weeklyInsurance + doubleDriverCharge;
      const difference = finalEarnings - finalCashCollect;
      const currentOS = netWeeklyRent - finalToll - difference - vehicleAdjustment 
        + finalPlatformFee + tds + rtoFine + accident + deadKm;

      const billData = {
        vehicleNumber,
        driverName: driverName || 'Unknown Driver',
        rentalDays,
        trips: finalTrips,
        dailyRent,
        weeklyInsurance,
        doubleDriverCharge,
        netWeeklyRent,
        totalEarnings: finalEarnings,
        totalCashCollect: finalCashCollect,
        difference,
        platformFee: finalPlatformFee,
        toll: finalToll,
        tds,
        vehicleAdjustment,
        rtoFine,
        accident,
        deadKm,
        currentOS,
      };

      bills.push(billData);
    } catch (error) {
      console.warn('Error parsing row for vehicle', vehicleNumber, error);
      // Continue with next row
    }
  });

  return bills;
};

/**
 * Extract bills from simple text (fallback method)
 * @param {string} pdfText - Text extracted from PDF
 * @returns {Array} - Array of extracted bill objects
 */
const extractBillsFromText = (pdfText) => {
  const bills = [];
  
  // Patterns to extract different fields (original approach)
  const patterns = {
    vehicleNumber: /(?:vehicle|car|plate|number)[\s:]*([A-Z0-9\s-]+)/i,
    driverName: /(?:driver|name)[\s:]*([A-Za-z\s]+)/i,
    rentalDays: /(?:rental|days|day|onroad)[\s:]*(\d+)/i,
    trips: /(?:trips|trip)[\s:]*(\d+)/i,
    dailyRent: /(?:daily|rent)[\s:]*(\d+\.?\d*)/i,
    weeklyInsurance: /(?:weekly|insurance|indemnity)[\s:]*(\d+\.?\d*)/i,
    doubleDriverCharge: /(?:double|driver|charge)[\s:]*(\d+\.?\d*)/i,
    totalEarnings: /(?:total|earnings|earning)[\s:]*(\d+\.?\d*)/i,
    totalCashCollect: /(?:total|cash|collect|collection|payouts)[\s:]*(\d+\.?\d*)/i,
    platformFee: /(?:platform|fee|driver|pass|subscription)[\s:]*(\d+\.?\d*)/i,
    toll: /(?:toll)[\s:]*(\d+\.?\d*)/i,
    tds: /(?:tds|tax)[\s:]*(\d+\.?\d*)/i,
    vehicleAdjustment: /(?:vehicle|adjustment)[\s:]*(\d+\.?\d*)/i,
    rtoFine: /(?:rto|fine)[\s:]*(\d+\.?\d*)/i,
    accident: /(?:accident)[\s:]*(\d+\.?\d*)/i,
    deadKm: /(?:dead|km|kilometer)[\s:]*(\d+\.?\d*)/i,
  };

  // Extract string value
  const extractStringValue = (pattern, text, defaultValue = '') => {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
    return defaultValue;
  };

  // Extract numeric value
  const extractNumericValue = (pattern, text, defaultValue = null) => {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = parseFloat(match[1].trim().replace(/,/g, ''));
      return isNaN(value) ? defaultValue : value;
    }
    return defaultValue;
  };

  // Extract one bill from the entire text
  const billData = {
    vehicleNumber: extractStringValue(patterns.vehicleNumber, pdfText, ''),
    driverName: extractStringValue(patterns.driverName, pdfText, ''),
    rentalDays: extractNumericValue(patterns.rentalDays, pdfText, 7),
    trips: extractNumericValue(patterns.trips, pdfText, 0),
    dailyRent: extractNumericValue(patterns.dailyRent, pdfText, 0),
    weeklyInsurance: extractNumericValue(patterns.weeklyInsurance, pdfText, 210),
    doubleDriverCharge: extractNumericValue(patterns.doubleDriverCharge, pdfText, 0),
    totalEarnings: extractNumericValue(patterns.totalEarnings, pdfText, 0),
    totalCashCollect: extractNumericValue(patterns.totalCashCollect, pdfText, 0),
    platformFee: extractNumericValue(patterns.platformFee, pdfText, 0),
    toll: extractNumericValue(patterns.toll, pdfText, 0),
    tds: extractNumericValue(patterns.tds, pdfText, 0),
    vehicleAdjustment: extractNumericValue(patterns.vehicleAdjustment, pdfText, 0),
    rtoFine: extractNumericValue(patterns.rtoFine, pdfText, 0),
    accident: extractNumericValue(patterns.accident, pdfText, 0),
    deadKm: extractNumericValue(patterns.deadKm, pdfText, 0),
  };

  // Normalize vehicle number
  if (billData.vehicleNumber) {
    billData.vehicleNumber = normalizeVehicleNumber(billData.vehicleNumber);
  }

  // Calculate derived fields
  const netWeeklyRent = (billData.dailyRent * billData.rentalDays) + billData.weeklyInsurance + billData.doubleDriverCharge;
  const difference = billData.totalEarnings - billData.totalCashCollect;
  const currentOS = netWeeklyRent - billData.toll - difference - billData.vehicleAdjustment 
    + billData.platformFee + billData.tds + billData.rtoFine + billData.accident + billData.deadKm;

  billData.netWeeklyRent = netWeeklyRent;
  billData.difference = difference;
  billData.currentOS = currentOS;

  // Only add if we have at least a vehicle number
  if (billData.vehicleNumber) {
    bills.push(billData);
  }

  return bills;
};

/**
 * Parse PDF and extract bill data
 * @param {File} file - PDF file to parse
 * @returns {Promise<Array>} - Array of extracted bill objects
 */
export const parsePDFBills = async (file) => {
  try {
    console.log('Extracting text from PDF...');
    const pdfText = await extractTextFromPDF(file);
    console.log('PDF text extracted, length:', pdfText.length);
    console.log('First 500 characters:', pdfText.substring(0, 500));
    
    const bills = extractBillDataFromText(pdfText);
    console.log('Extracted bills count:', bills.length);
    
    return bills;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
};

