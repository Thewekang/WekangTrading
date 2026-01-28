/**
 * Image validation utilities for client and server
 */

/**
 * Validate base64 image size
 * Returns true if image is within size limit (500KB)
 */
export function validateImageSize(base64String: string): { valid: boolean; sizeKB: number } {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  
  // Calculate size in bytes (base64 is ~33% larger than original)
  const sizeBytes = (base64Data.length * 3) / 4;
  const sizeKB = sizeBytes / 1024;
  
  const maxSizeKB = 500;
  
  return {
    valid: sizeKB <= maxSizeKB,
    sizeKB: Math.round(sizeKB)
  };
}
