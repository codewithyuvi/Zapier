import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from 'primary-backend/src/router';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3001/trpc',
      headers() {
        let userId = '1';
        if (typeof window !== 'undefined') {
          userId = localStorage.getItem('userId') || '1';
        }
        return {
          authorization: userId,
        };
      },
    }),
  ],
});