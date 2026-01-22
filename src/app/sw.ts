/// <reference lib="webworker" />

import { Serwist } from 'serwist';
import { defaultCache } from '@serwist/next/worker';

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<{
    url: string;
    revision?: string | null;
  }>;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: defaultCache
});

serwist.addEventListeners();
