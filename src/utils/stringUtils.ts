/**
 * String utility functions
 */

/**
 * Strips HTML tags from a string
 * @param htmlString - String that may contain HTML tags
 * @returns Plain text string without HTML tags
 *
 * @example
 * stripHtmlTags('<p>Testing Job!</p>') // Returns: 'Testing Job!'
 * stripHtmlTags('<div><h1>Title</h1><p>Content</p></div>') // Returns: 'TitleContent'
 * stripHtmlTags('Plain text') // Returns: 'Plain text'
 */
export const stripHtmlTags = (htmlString: string | null | undefined): string => {
  // Handle null or undefined
  if (!htmlString) {
    return '';
  }

  // Remove HTML tags using regex
  // This regex matches any HTML tag and removes it
  const withoutTags = htmlString.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  const decoded = withoutTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Trim extra whitespace and return
  return decoded.trim();
};

/**
 * Formats an address from Location table fields
 * Format: street_number, street, building, country_name, zip_code
 * @param location - Location object with address fields
 * @returns Formatted address string
 *
 * @example
 * formatLocationAddress({ street_number: '123', street: 'Main St', building: 'Suite 200', country_name: 'USA', zip_code: '12345' })
 * // Returns: '123, Main St, Suite 200, USA, 12345'
 */
export const formatLocationAddress = (location: {
  street_number?: string | null;
  street?: string | null;
  building?: string | null;
  country_name?: string | null;
  zip_code?: string | null;
}): string => {
  const addressParts: string[] = [];

  if (location.street_number) {
    addressParts.push(location.street_number);
  }
  if (location.street) {
    addressParts.push(location.street);
  }
  if (location.building) {
    addressParts.push(location.building);
  }
  if (location.country_name) {
    addressParts.push(location.country_name);
  }
  if (location.zip_code) {
    addressParts.push(location.zip_code);
  }

  return addressParts.length > 0 ? addressParts.join(', ') : '';
};
