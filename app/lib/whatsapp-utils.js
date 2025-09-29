/**
 * WhatsApp redirect URL utility functions
 * Provides functionality to create WhatsApp redirect URLs with proper formatting
 */

/**
 * Validates and formats a phone number for WhatsApp URL
 * @param {string} phoneNumber - Phone number in any format
 * @returns {string|null} - Formatted phone number with +91 code or null if invalid
 */
export function formatPhoneForWhatsApp(phoneNumber) {
  if (!phoneNumber) return null;
  
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Check if number has at least 10 digits (minimum for most phone numbers)
  if (cleanNumber.length < 10) return null;
  
  // If number starts with 0, remove it (common in some countries)
  let processedNumber = cleanNumber;
  if (processedNumber.startsWith('0')) {
    processedNumber = processedNumber.substring(1);
  }
  
  // If number doesn't start with 91 (India country code) and is 10 digits, add 91
  if (!processedNumber.startsWith('91') && processedNumber.length === 10) {
    processedNumber = '91' + processedNumber;
  }
  
  // If number already starts with 91, keep it as is
  // If number starts with other country codes, keep it as is
  
  return processedNumber;
}

/**
 * URL encodes a message for WhatsApp
 * @param {string} message - Message to encode
 * @returns {string} - URL encoded message
 */
export function encodeMessageForWhatsApp(message) {
  if (!message) return '';
  
  // Use encodeURIComponent for proper URL encoding
  return encodeURIComponent(message.trim());
}

/**
 * Creates a WhatsApp redirect URL
 * @param {string} phoneNumber - Phone number in international format
 * @param {string} message - Optional pre-filled message
 * @returns {string|null} - WhatsApp URL or null if phone number is invalid
 */
export function createWhatsAppURL(phoneNumber, message = '') {
  const formattedPhone = formatPhoneForWhatsApp(phoneNumber);
  
  if (!formattedPhone) return null;
  
  let url = `https://wa.me/${formattedPhone}`;
  
  if (message && message.trim()) {
    const encodedMessage = encodeMessageForWhatsApp(message);
    url += `?text=${encodedMessage}`;
  }
  
  return url;
}

/**
 * Validates if a phone number is valid for WhatsApp
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidWhatsAppPhone(phoneNumber) {
  const formatted = formatPhoneForWhatsApp(phoneNumber);
  // Valid if formatted number exists and has at least 12 digits (91 + 10 digit number)
  // or at least 10 digits for other countries
  return formatted !== null && formatted.length >= 10;
}

/**
 * Opens WhatsApp URL in a new window/tab
 * @param {string} phoneNumber - Phone number
 * @param {string} message - Optional message
 * @returns {boolean} - True if URL was opened, false if invalid
 */
export function openWhatsAppChat(phoneNumber, message = '') {
  const url = createWhatsAppURL(phoneNumber, message);
  
  if (!url) return false;
  
  // Open in new window/tab
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

/**
 * Creates a formatted display string for phone numbers
 * @param {string} phoneNumber - Raw phone number
 * @returns {string} - Formatted display string with +91 for Indian numbers
 */
export function formatPhoneDisplay(phoneNumber) {
  if (!phoneNumber) return '';
  
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format phone numbers with proper country codes
  if (cleaned.length >= 10) {
    // Indian phone number (10 digits)
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    } 
    // Indian phone number with country code (12 digits starting with 91)
    else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      const number = cleaned.slice(2); // Remove 91 prefix
      return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
    }
    // US phone number (11 digits starting with 1)
    else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } 
    // Other international numbers
    else {
      return `+${cleaned}`;
    }
  }
  
  return phoneNumber;
}