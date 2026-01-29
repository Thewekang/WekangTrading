import sanitize from 'sanitize-html';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses sanitize-html which works in Node.js serverless environments
 */
export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'code', 'pre',
      'blockquote', 'hr',
      'img', 'figure', 'figcaption'
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'rel', 'class'],
      'img': ['src', 'alt', 'title', 'class'],
      '*': ['class']
    },
    allowedSchemes: ['http', 'https', 'data'],
    // Allow data: URLs for base64 images
    allowedSchemesByTag: {
      img: ['http', 'https', 'data']
    }
  });
}
