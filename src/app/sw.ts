/// <reference lib="webworker" />

import { Serwist } from 'serwist';

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<{
    url: string;
    revision?: string | null;
  }>;
};

const OFFLINE_URL = '/dashboard/individual';

const serwist = new Serwist({
  precacheEntries: [
    ...self.__SW_MANIFEST,
    { url: OFFLINE_URL, revision: null }
  ],
  skipWaiting: true,
  clientsClaim: true,

  importScripts: ['/firebase-messaging-sw.js']
});

serwist.addEventListeners();

serwist.addEventListeners();
