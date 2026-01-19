/**
 * Utility functions for Indian currency and number formatting
 */

/**
 * Format currency in Indian Rupees (INR)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format numbers in Indian format (with commas at thousands, lakhs, crores)
 * @param {number} number - The number to format
 * @returns {string} Formatted number string
 */
export const formatIndianNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) {
    return "0";
  }

  return new Intl.NumberFormat("en-IN").format(number);
};

/**
 * Format dates in Indian format (DD/MM/YYYY)
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN");
};

/**
 * Format large numbers with Indian suffixes (K, L, Cr)
 * @param {number} number - The number to format
 * @returns {string} Formatted number with suffix
 */
export const formatIndianNumberWithSuffix = (number) => {
  if (number === null || number === undefined || isNaN(number)) {
    return "0";
  }

  if (number >= 10000000) {
    return (number / 10000000).toFixed(1) + " Cr";
  } else if (number >= 100000) {
    return (number / 100000).toFixed(1) + " L";
  } else if (number >= 1000) {
    return (number / 1000).toFixed(1) + " K";
  }

  return number.toString();
};

/**
 * Format percentage in Indian format
 * @param {number} value - The percentage value
 * @param {number} total - The total value
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, total) => {
  if (!total || total === 0) return "0%";

  const percentage = (value / total) * 100;
  return percentage.toFixed(1) + "%";
};
