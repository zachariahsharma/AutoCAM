import { parseParamId, routeFactory } from "@/lib/api-utils";
import { createBoxTube, getBoxTubes } from "@/app/api/boxTubes/route";

export const GET = routeFactory(async (req, authType, tx, id) => getBoxTubes(authType, tx, id));
export const POST = routeFactory(async (req, authType, tx, id) => createBoxTube(authType, tx, await req.formData(), id))
