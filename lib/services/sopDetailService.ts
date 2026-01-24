import { db } from '@/lib/db';
import { sopTypes } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Get SOP types with details (only those with detailEnabled = true)
 * Used by users to view strategy guides
 * Returns both short and long entry strategies if enabled
 */
export async function getSopTypesWithDetails() {
  return await db
    .select({
      id: sopTypes.id,
      name: sopTypes.name,
      description: sopTypes.description,
      detailContentShort: sopTypes.detailContentShort,
      detailContentLong: sopTypes.detailContentLong,
      detailEnabledShort: sopTypes.detailEnabledShort,
      detailEnabledLong: sopTypes.detailEnabledLong,
      detailUpdatedAt: sopTypes.detailUpdatedAt,
      sortOrder: sopTypes.sortOrder,
    })
    .from(sopTypes)
    .where(
      and(
        eq(sopTypes.active, true),
        // Return if either short or long is enabled
        sql`(${sopTypes.detailEnabledShort} = 1 OR ${sopTypes.detailEnabledLong} = 1)`
      )
    )
    .orderBy(sopTypes.sortOrder, sopTypes.name);
}

/**
 * Get single SOP type with detail content (admin)
 */
export async function getSopTypeWithDetail(id: string) {
  const [sopType] = await db
    .select()
    .from(sopTypes)
    .where(eq(sopTypes.id, id))
    .limit(1);

  return sopType;
}

/**
 * Update SOP detail content (Short and/or Long entry strategies)
 */
export async function updateSopDetail(
  id: string,
  data: {
    detailContentShort?: string;
    detailContentLong?: string;
    detailEnabledShort?: boolean;
    detailEnabledLong?: boolean;
  },
  updatedBy: string
) {
  // Sanitize HTML content if provided
  let sanitizedContentShort = data.detailContentShort;
  let sanitizedContentLong = data.detailContentLong;
  
  if (data.detailContentShort) {
    sanitizedContentShort = DOMPurify.sanitize(data.detailContentShort, {
      ALLOWED_TAGS: [
        'h2', 'h3', 'h4', 'p', 'strong', 'em', 'u', 's',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
        'a', 'br', 'hr', 'img'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class'],
      ALLOW_DATA_ATTR: false,
    });
  }

  if (data.detailContentLong) {
    sanitizedContentLong = DOMPurify.sanitize(data.detailContentLong, {
      ALLOWED_TAGS: [
        'h2', 'h3', 'h4', 'p', 'strong', 'em', 'u', 's',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
        'a', 'br', 'hr', 'img'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class'],
      ALLOW_DATA_ATTR: false,
    });
  }

  const [updated] = await db
    .update(sopTypes)
    .set({
      ...(sanitizedContentShort !== undefined && { detailContentShort: sanitizedContentShort }),
      ...(sanitizedContentLong !== undefined && { detailContentLong: sanitizedContentLong }),
      ...(data.detailEnabledShort !== undefined && { detailEnabledShort: data.detailEnabledShort }),
      ...(data.detailEnabledLong !== undefined && { detailEnabledLong: data.detailEnabledLong }),
      detailUpdatedAt: new Date(),
      detailUpdatedBy: updatedBy,
      updatedAt: new Date()
    })
    .where(eq(sopTypes.id, id))
    .returning();

  if (!updated) {
    throw new Error('SOP type not found');
  }

  return updated;
}

/**
 * Clear SOP detail content (both short and long)
 */
export async function clearSopDetail(id: string) {
  const [updated] = await db
    .update(sopTypes)
    .set({
      detailContentShort: null,
      detailContentLong: null,
      detailEnabledShort: false,
      detailEnabledLong: false,
      detailUpdatedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(sopTypes.id, id))
    .returning();

  if (!updated) {
    throw new Error('SOP type not found');
  }

  return updated;
}

/**
 * Sanitize HTML content (can be called separately for validation)
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h2', 'h3', 'h4', 'p', 'strong', 'em', 'u', 's',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
      'a', 'br', 'hr', 'img'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}

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
