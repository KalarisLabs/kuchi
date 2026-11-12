import { clerkMiddleware } from '@clerk/astro/server';

// All routes stay public; the gallery never requires sign-in.
export const onRequest = clerkMiddleware();
