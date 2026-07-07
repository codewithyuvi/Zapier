import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from 'primary-backend/src/router';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3001/trpc',
      headers() {
        return {
          authorization: '1', // Hardcoded user ID for now
        };
      },
    }),
  ],
});