export function normalizeKsaMobile(mobile: string | null): string {
  if (!mobile) return '';

  // Remove all non-digit characters just in case
  const digitsOnly = mobile.replace(/\D/g, '');

  // Remove KSA prefixes
  const normalized = digitsOnly.replace(/^(00966|966|\+966)/, '');

  // Ensure it starts with 05
  if (!normalized.startsWith('5')) return mobile; // not a valid KSA mobile
  return '0' + normalized;
}
