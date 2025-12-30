import { routeFactory } from "@/lib/api";
import { createPartCategory, getPartCategories } from "@/app/api/pc/route";

export const GET = routeFactory(
  async (req, authType, tx, id) => getPartCategories(authType, tx, req.nextUrl.searchParams, id)
);

export const POST = routeFactory(
  async (req, authType, tx, id) => createPartCategory(tx, await req.json(), id),
  { emailVerifiedNeeded: true }
);