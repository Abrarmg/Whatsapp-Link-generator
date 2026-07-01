/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_COUNTRY_CODE } from '../data/staticData';

/**
 * Sanitizes and parses raw phone number inputs based on smart country code logic.
 *
 * @param phone Raw phone number input from the user.
 * @param defaultPrefix The active country code prefix (e.g., '92' for Pakistan).
 */
export function parsePhoneNumber(phone: string, defaultPrefix: string = '92'): {
  sanitized: string;       // Pure digit format for WhatsApp URL (e.g., "923001234567")
  displayFormatted: string; // Beautiful user-facing format (e.g., "+92 300 1234567")
  isValid: boolean;        // Whether the number has sufficient digits
  hasCountryCode: boolean; // Whether the user explicitly provided a country code
  detectedPrefix: string;  // The prefix used
} {
  let raw = phone.trim();
  if (!raw) {
    return {
      sanitized: '',
      displayFormatted: '',
      isValid: false,
      hasCountryCode: false,
      detectedPrefix: defaultPrefix,
    };
  }

  let isInternational = false;

  // 1. Detect if the number starts with '+' or '00'
  if (raw.startsWith('+')) {
    isInternational = true;
    raw = raw.substring(1);
  } else if (raw.startsWith('00')) {
    isInternational = true;
    raw = raw.substring(2);
  }

  // 2. Remove all non-digit characters (spaces, dashes, parentheses, dots, etc.)
  let digits = raw.replace(/\D/g, '');

  // 3. Handle local single leading zero (e.g., "03001234567" -> "3001234567")
  // Only strip it if the user did not specify '+' or '00' international prefix
  if (!isInternational && digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  let finalNumber = '';
  let hasCode = isInternational;
  let detectedPrefix = defaultPrefix;

  if (isInternational) {
    // If they typed '+' or '00', they explicitly specified the country code. Keep as-is.
    finalNumber = digits;
    
    // Attempt to extract prefix for beautiful display
    if (defaultPrefix && digits.startsWith(defaultPrefix)) {
      detectedPrefix = defaultPrefix;
    } else {
      // Guess prefix (first 1 to 3 digits)
      detectedPrefix = digits.substring(0, Math.min(3, digits.length));
    }
  } else {
    // Check if it's already an international number typed without '+' or '00'
    // E.g. digits of length 11+ not starting with a domestic trunk prefix '0'
    const looksLikeInternational = digits.length >= 11 && !digits.startsWith('0');

    if (looksLikeInternational) {
      finalNumber = digits;
      hasCode = true;
      
      // Determine detected prefix
      if (defaultPrefix && digits.startsWith(defaultPrefix)) {
        detectedPrefix = defaultPrefix;
      } else {
        detectedPrefix = digits.substring(0, Math.min(3, digits.length));
      }
    } else {
      // Otherwise, treat as a local number and prepend the active default prefix
      if (defaultPrefix) {
        finalNumber = defaultPrefix + digits;
        hasCode = false;
        detectedPrefix = defaultPrefix;
      } else {
        finalNumber = digits;
        hasCode = true;
        detectedPrefix = digits.substring(0, Math.min(3, digits.length));
      }
    }
  }

  // 4. Validate number length (WhatsApp numbers usually have 8 to 15 digits total)
  const isValid = finalNumber.length >= 8 && finalNumber.length <= 15;

  // 5. Generate beautiful format: +{prefix} {rest of the digits}
  let displayFormatted = '';
  if (finalNumber.length > 0) {
    if (detectedPrefix && finalNumber.startsWith(detectedPrefix)) {
      const rest = finalNumber.substring(detectedPrefix.length);
      // Group the rest beautifully if possible
      if (rest.length > 6) {
        displayFormatted = `+${detectedPrefix} ${rest.substring(0, 3)} ${rest.substring(3)}`;
      } else {
        displayFormatted = `+${detectedPrefix} ${rest}`;
      }
    } else {
      displayFormatted = `+${finalNumber}`;
    }
  }

  return {
    sanitized: finalNumber,
    displayFormatted,
    isValid,
    hasCountryCode: hasCode,
    detectedPrefix,
  };
}

/**
 * Generates a valid standard WhatsApp Link
 */
export function generateWhatsAppLink(sanitizedNumber: string, message: string): string {
  if (!sanitizedNumber) return '';
  const baseUrl = `https://wa.me/${sanitizedNumber}`;
  if (!message.trim()) {
    return baseUrl;
  }
  const encodedText = encodeURIComponent(message.trim());
  return `${baseUrl}?text=${encodedText}`;
}
