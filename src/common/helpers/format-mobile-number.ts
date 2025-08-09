export const formatMobileNumber = (number: string): string => {
  // Remove all non-digit characters just in case
  const cleaned = number.replace(/\D/g, '');

  if (cleaned.startsWith('00966')) {
    return cleaned;
  } else if (cleaned.startsWith('966')) {
    return '00966' + cleaned.slice(3);
  } else if (cleaned.startsWith('05')) {
    return '00966' + cleaned.slice(1);
  } else {
    // fallback – just add it if nothing matches
    return '00966' + cleaned;
  }
};
