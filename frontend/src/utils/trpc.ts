import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from 'primary-backend/src/router';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3001/trpc',
      headers() {
        let token = '';
        if (typeof window !== 'undefined') {
          token = localStorage.getItem('token') || '';
        }
        return {
          authorization: `Bearer ${token}`,
        };
      },
    }),
  ],
});