/**
 * Weighted Random Selection Utility
 * Implements algorithm for selecting items based on weight values
 */

export interface WeightedItem {
  weight: number;
  [key: string]: any;
}

/**
 * Select a single item from array using weighted random selection
 * Items with higher weight have proportionally higher chance of being selected
 * 
 * @param items - Array of items with weight property
 * @returns Single selected item, or null if array is empty
 * 
 * @example
 * const items = [
 *   { id: 1, weight: 5 },
 *   { id: 2, weight: 10 },
 *   { id: 3, weight: 1 }
 * ];
 * const selected = selectWeightedRandom(items);
 * // Item with weight 10 is twice as likely to be selected as weight 5
 */
export function selectWeightedRandom<T extends WeightedItem>(items: T[]): T | null {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];

  // Calculate total weight
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  // Handle edge case where all weights are 0
  if (totalWeight === 0) {
    return items[Math.floor(Math.random() * items.length)];
  }

  // Generate random number between 0 and total weight
  let random = Math.random() * totalWeight;

  // Find the item that corresponds to the random number
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }

  // Fallback (should never reach here due to floating point precision)
  return items[items.length - 1];
}

/**
 * Filter out recently shown items to prevent repetition
 * 
 * @param items - Array of all items
 * @param recentIds - Array of recently shown item IDs
 * @param idKey - Key name for the ID property (default: 'id')
 * @returns Filtered array with recent items removed
 */
export function filterAntiRepeat<T extends Record<string, any>>(
  items: T[],
  recentIds: string[],
  idKey: string = 'id'
): T[] {
  if (recentIds.length === 0) return items;
  
  const filtered = items.filter(item => !recentIds.includes(item[idKey]));
  
  // If all items are in recent list, return all items (reset anti-repeat)
  return filtered.length > 0 ? filtered : items;
}

/**
 * Calculate probability of each item being selected
 * Useful for testing and visualization
 * 
 * @param items - Array of items with weight property
 * @returns Array of items with added probability percentage
 */
export function calculateProbabilities<T extends WeightedItem>(
  items: T[]
): Array<T & { probability: number }> {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  
  if (totalWeight === 0) {
    const equalProbability = 100 / items.length;
    return items.map(item => ({ ...item, probability: equalProbability }));
  }
  
  return items.map(item => ({
    ...item,
    probability: (item.weight / totalWeight) * 100,
  }));
}
