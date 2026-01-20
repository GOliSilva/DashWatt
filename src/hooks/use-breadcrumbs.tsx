'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// This allows to add custom title as well
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Dashboard', link: '/dashboard' }],
  '/dashboard/employee': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Employee', link: '/dashboard/employee' }
  ],
  '/dashboard/product': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Product', link: '/dashboard/product' }
  ]
  // Add more custom mappings as needed
};

export function useBreadcrumbs() {
  const pathname = usePathname();
  const [projectName, setProjectName] = useState<string | null>(null);

  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const projectIndex = segments.findIndex(
      (segment, index) =>
        segment === 'projetos' &&
        segments[index - 1] === 'acompanhamento' &&
        segments[index - 2] === 'dashboard'
    );
    const projectId = projectIndex >= 0 ? segments[projectIndex + 1] : null;
    if (!projectId) {
      setProjectName(null);
      return;
    }

    try {
      const storedName = sessionStorage.getItem(`project-name:${projectId}`);
      setProjectName(storedName || null);
    } catch {
      setProjectName(null);
    }

    const handleProjectName = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; name: string }>)
        .detail;
      if (detail?.id === projectId) {
        setProjectName(detail.name);
      }
    };

    window.addEventListener('project-name-updated', handleProjectName);
    return () => {
      window.removeEventListener('project-name-updated', handleProjectName);
    };
  }, [pathname]);

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      const title =
        projectName && segment === segments[segments.length - 1]
          ? projectName
          : segment.charAt(0).toUpperCase() + segment.slice(1);
      return {
        title,
        link: path
      };
    });
  }, [pathname, projectName]);

  return breadcrumbs;
}
