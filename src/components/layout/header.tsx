import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { UserNav } from './user-nav';
import CtaGithub from './cta-github';
import { AlertsButton } from './alerts-button';

export default function Header() {
  return (
    <header className='flex h-14 shrink-0 items-center justify-between gap-2 px-2 transition-[width,height] ease-linear sm:px-3 md:h-16 md:px-4 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex min-w-0 items-center gap-2'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <div className='hidden md:block'>
          <Breadcrumbs />
        </div>
      </div>

      <div className='flex items-center gap-1 sm:gap-2'>
        <div className='hidden md:block'>
          <CtaGithub />
        </div>
          <SearchInput />
        <AlertsButton />
        <UserNav />
      </div>
    </header>
  );
}
