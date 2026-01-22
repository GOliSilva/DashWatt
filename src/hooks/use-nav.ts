'use client';

/**
 * Client-side hook for navigation items.
 *
 * RBAC is disabled in this project; all items are returned as-is.
 * In production, only "Individual" page is shown.
 */

import { useMemo } from 'react';
import type { NavItem } from '@/types';

/**
 * Hook to return navigation items.
 *
 * @param items - Array of navigation items
 * @returns Items (filtered in production to show only Individual)
 */
export function useFilteredNavItems(items: NavItem[]) {
  return useMemo(() => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      return items;
    }
    
    // Em produção, mostrar apenas o item "Individual"
    return items.filter((item) => {
      // Verificar se o item é "Individual" pelo URL
      if (item.url === '/dashboard/individual') {
        return true;
      }
      
      // Verificar se algum sub-item é "Individual"
      if (item.items && item.items.length > 0) {
        const filteredSubItems = item.items.filter(
          (subItem) => subItem.url === '/dashboard/individual'
        );
        
        if (filteredSubItems.length > 0) {
          // Retornar o item pai com apenas os sub-itens filtrados
          item.items = filteredSubItems;
          return true;
        }
      }
      
      return false;
    });
  }, [items]);
}
