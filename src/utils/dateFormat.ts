/**
 * Format a date string to dd-mm-yyyy format
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string in dd-mm-yyyy format
 */
export const formatDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Format a date string to dd-mm-yyyy HH:MM format
 * @param dateString - ISO date string or Date object
 * @returns Formatted datetime string in dd-mm-yyyy HH:MM format
 */
export const formatDateTime = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};
