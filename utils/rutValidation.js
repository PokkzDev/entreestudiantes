/**
 * Chilean RUT validation utilities
 * Implements the proper check digit algorithm for validating Chilean RUTs
 */

/**
 * Validates a Chilean RUT using the check digit algorithm
 * @param {string} rut - The RUT to validate (can be with or without formatting)
 * @returns {boolean} - True if the RUT is valid, false otherwise
 */
export function validateRut(rut) {
  if (!rut || typeof rut !== 'string') {
    return false;
  }

  // Clean the RUT: remove dots, spaces, and convert to uppercase
  const cleanRut = rut.replace(/[.\s-]/g, '').toUpperCase();

  // Check if RUT has valid format (7-8 digits + check digit)
  if (!/^[0-9]{7,8}[0-9K]$/.test(cleanRut)) {
    return false;
  }

  // Separate body and check digit
  const body = cleanRut.slice(0, -1);
  const checkDigit = cleanRut.slice(-1);

  // Calculate the expected check digit
  const expectedCheckDigit = calculateCheckDigit(body);

  return checkDigit === expectedCheckDigit;
}

/**
 * Calculates the check digit for a Chilean RUT
 * @param {string} rutBody - The body of the RUT (without check digit)
 * @returns {string} - The calculated check digit ('0'-'9' or 'K')
 */
export function calculateCheckDigit(rutBody) {
  if (!rutBody || typeof rutBody !== 'string') {
    return '';
  }

  // Convert to array of digits
  const digits = rutBody.split('').map(Number);
  
  // Multipliers sequence: [2, 3, 4, 5, 6, 7]
  const multipliers = [2, 3, 4, 5, 6, 7];
  let sum = 0;
  let multiplierIndex = 0;

  // Calculate sum from right to left
  for (let i = digits.length - 1; i >= 0; i--) {
    sum += digits[i] * multipliers[multiplierIndex];
    multiplierIndex = (multiplierIndex + 1) % multipliers.length;
  }

  // Calculate remainder
  const remainder = sum % 11;
  const checkDigit = 11 - remainder;

  // Convert to check digit character
  if (checkDigit === 11) return '0';
  if (checkDigit === 10) return 'K';
  return checkDigit.toString();
}

/**
 * Formats a RUT with proper formatting (dots and dash)
 * @param {string} rut - The RUT to format
 * @returns {string} - The formatted RUT (e.g., "12.345.678-9")
 */
export function formatRut(rut) {
  if (!rut || typeof rut !== 'string') {
    return '';
  }

  // Clean the RUT
  const cleanRut = rut.replace(/[^0-9kK]/g, '');
  
  if (cleanRut.length < 2) {
    return rut;
  }

  // Separate body and check digit
  const body = cleanRut.slice(0, -1);
  const checkDigit = cleanRut.slice(-1).toUpperCase();

  // Add dots to body (thousands separators)
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedBody}-${checkDigit}`;
}

/**
 * Validates and formats a RUT, returning both validation result and formatted RUT
 * @param {string} rut - The RUT to validate and format
 * @returns {object} - {isValid: boolean, formattedRut: string, cleanRut: string}
 */
export function validateAndFormatRut(rut) {
  if (!rut || typeof rut !== 'string') {
    return {
      isValid: false,
      formattedRut: '',
      cleanRut: ''
    };
  }

  // Clean the RUT for validation
  const cleanRut = rut.replace(/[.\s-]/g, '').toUpperCase();
  
  // Validate
  const isValid = validateRut(cleanRut);
  
  // Format only if it looks like a RUT (has enough characters)
  let formattedRut = '';
  if (cleanRut.length >= 2) {
    const body = cleanRut.slice(0, -1);
    const checkDigit = cleanRut.slice(-1);
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    formattedRut = `${formattedBody}-${checkDigit}`;
  } else {
    formattedRut = rut;
  }

  return {
    isValid,
    formattedRut,
    cleanRut: cleanRut
  };
}

/**
 * Simple formatting function for real-time input (without full validation)
 * @param {string} input - The current input value
 * @returns {string} - The formatted input with dash before last character
 */
export function formatRutInput(input) {
  if (!input) return '';
  
  // Remove all non-numeric characters except K and k
  const cleanInput = input.replace(/[^0-9kK]/g, '');
  
  if (cleanInput.length < 2) return cleanInput;
  
  // Separate body and digit
  const body = cleanInput.slice(0, -1);
  const digit = cleanInput.slice(-1).toLowerCase();
  
  // Add dash before the last digit
  return `${body}-${digit}`;
}

// CommonJS exports for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateRut,
    calculateCheckDigit,
    formatRut,
    validateAndFormatRut,
    formatRutInput
  };
} 