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
