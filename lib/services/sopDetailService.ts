import { db } from '@/lib/db';
import { sopTypes } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { validateImageSize } from '@/lib/utils/imageValidation';
import { sanitizeHtml } from '@/lib/utils/sanitize';

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
  // Parse JSON structure, sanitize HTML content, then re-wrap
  let sanitizedContentShort = data.detailContentShort;
  let sanitizedContentLong = data.detailContentLong;
  
  if (data.detailContentShort) {
    try {
      const parsed = JSON.parse(data.detailContentShort);
      if (parsed.content !== undefined) {
        // Sanitize only the HTML content part
        parsed.content = sanitizeHtml(parsed.content);
        sanitizedContentShort = JSON.stringify(parsed);
      } else {
        // Legacy plain text - sanitize directly
        sanitizedContentShort = sanitizeHtml(data.detailContentShort);
      }
    } catch {
      // Not JSON - sanitize as plain text
      sanitizedContentShort = sanitizeHtml(data.detailContentShort);
    }
  }

  if (data.detailContentLong) {
    try {
      const parsed = JSON.parse(data.detailContentLong);
      if (parsed.content !== undefined) {
        // Sanitize only the HTML content part
        parsed.content = sanitizeHtml(parsed.content);
        sanitizedContentLong = JSON.stringify(parsed);
      } else {
        // Legacy plain text - sanitize directly
        sanitizedContentLong = sanitizeHtml(data.detailContentLong);
      }
    } catch {
      // Not JSON - sanitize as plain text
      sanitizedContentLong = sanitizeHtml(data.detailContentLong);
    }
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


