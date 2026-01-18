'use client';

/**
 * Client-side hook for navigation items.
 *
 * RBAC is disabled in this project; all items are returned as-is.
 */

import { useMemo } from 'react';
import type { NavItem } from '@/types';

/**
 * Hook to return navigation items.
 *
 * @param items - Array of navigation items
 * @returns Items (unfiltered)
 */
export function useFilteredNavItems(items: NavItem[]) {
  return useMemo(() => items, [items]);
}
