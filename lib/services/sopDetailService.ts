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
      detailImagesShort: sopTypes.detailImagesShort,
      detailImagesLong: sopTypes.detailImagesLong,
      detailImageNotesShort: sopTypes.detailImageNotesShort,
      detailImageNotesLong: sopTypes.detailImageNotesLong,
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
 * Now stores images and notes in dedicated columns (Migration 0006)
 */
export async function updateSopDetail(
  id: string,
  data: {
    detailContentShort?: string;
    detailContentLong?: string;
    detailImagesShort?: string[]; // Array of base64 images
    detailImagesLong?: string[]; // Array of base64 images
    detailImageNotesShort?: string;
    detailImageNotesLong?: string;
    detailEnabledShort?: boolean;
    detailEnabledLong?: boolean;
  },
  updatedBy: string
) {
  // Sanitize HTML content if provided
  const sanitizedContentShort = data.detailContentShort 
    ? sanitizeHtml(data.detailContentShort)
    : undefined;
    
  const sanitizedContentLong = data.detailContentLong
    ? sanitizeHtml(data.detailContentLong)
    : undefined;

  console.log('🔍 [Service] updateSopDetail called with:', {
    contentShort: sanitizedContentShort,
    imagesShort: data.detailImagesShort?.length,
    notesShort: data.detailImageNotesShort,
    contentLong: sanitizedContentLong,
    imagesLong: data.detailImagesLong?.length,
    notesLong: data.detailImageNotesLong
  });

  const [updated] = await db
    .update(sopTypes)
    .set({
      ...(sanitizedContentShort !== undefined && { 
        detailContentShort: sanitizedContentShort.trim() === '' ? null : sanitizedContentShort 
      }),
      ...(sanitizedContentLong !== undefined && { 
        detailContentLong: sanitizedContentLong.trim() === '' ? null : sanitizedContentLong 
      }),
      ...(data.detailImagesShort !== undefined && { 
        detailImagesShort: data.detailImagesShort.length > 0 ? JSON.stringify(data.detailImagesShort) : null 
      }),
      ...(data.detailImagesLong !== undefined && { 
        detailImagesLong: data.detailImagesLong.length > 0 ? JSON.stringify(data.detailImagesLong) : null 
      }),
      ...(data.detailImageNotesShort !== undefined && { detailImageNotesShort: data.detailImageNotesShort || null }),
      ...(data.detailImageNotesLong !== undefined && { detailImageNotesLong: data.detailImageNotesLong || null }),
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


