import { routeFactory, routeResponse } from "@/lib/api-utils";

export const GET = routeFactory(async (req, authType, tx) => routeResponse(200, await tx.query.Materials.findMany({
  columns: { id: true, name: true }
})));
