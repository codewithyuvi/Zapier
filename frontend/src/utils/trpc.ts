import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from 'primary-backend/src/router';
 
export const trpc = createTRPCReact<AppRouter>();