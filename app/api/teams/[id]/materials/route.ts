import { createMaterial, getMaterials } from "@/app/api/materials/route";
import { routeFactory } from "@/lib/api";

export const GET = routeFactory((req, authType, tx, id) => getMaterials(authType, tx, id));
export const POST = routeFactory(async (req, authType, tx, id) => createMaterial(authType, tx, await req.json(), id));