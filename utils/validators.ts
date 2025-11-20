
// Helper to get today's date string YYYY-MM-DD
export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const formatMozPhoneNumber = (value: string): string => {
  // Remove all non-numeric chars
  let numbers = value.replace(/\D/g, '');

  // Check if it starts with 258, if not, we treat it as local number
  if (numbers.startsWith('258')) {
    numbers = numbers.substring(3);
  }

  // Limit to 9 digits (standard MZ mobile: 82/84/85/86/87 + 7 digits)
  if (numbers.length > 9) {
    numbers = numbers.substring(0, 9);
  }

  // Apply formatting
  let formatted = '';
  if (numbers.length > 0) {
    formatted += '+258 ';
    if (numbers.length > 2) {
      formatted += numbers.substring(0, 2) + ' ';
      if (numbers.length > 5) {
        formatted += numbers.substring(2, 5) + ' ';
        formatted += numbers.substring(5);
      } else {
        formatted += numbers.substring(2);
      }
    } else {
      formatted += numbers;
    }
  }

  return formatted.trim();
};

export const isValidMozPhoneNumber = (phone: string): boolean => {
  // Clean format: +258 84 123 4567 -> 258841234567
  const clean = phone.replace(/\D/g, '');
  // Should start with 2588 or 258 (landline) and have 12 digits total (258 + 9 digits)
  // Regex: Starts with 258, followed by 8 or 2, followed by 8 digits
  const regex = /^258[28]\d{8}$/;
  return regex.test(clean);
};

export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const isDateInPast = (dateString: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const inputDate = new Date(dateString);
  inputDate.setHours(0, 0, 0, 0); // Normalize time for fair comparison

  return inputDate < today;
};
