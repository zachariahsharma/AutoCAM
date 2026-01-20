import router from '@/lib/api';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { NextRequest } from 'next/server';
import { createContext } from '@/lib/api/trpc';

const handler = (req: NextRequest) => fetchRequestHandler({
  endpoint: "/api/trpc",
  req,
  router,
  createContext
});

export {
  handler as GET,
  handler as POST
}
