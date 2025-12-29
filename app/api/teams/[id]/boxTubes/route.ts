import { Params } from "../route";
import { parseParamId, routeFactory } from "@/lib/api-utils";
import { createBoxTube, getBoxTubes } from "@/app/api/boxTubes/route";

export const GET = routeFactory<Params>(
  async (req, authType, tx, params) => getBoxTubes(authType, tx, await parseParamId(params.id))
);
export const POST = routeFactory<Params>(
  async (req, authType, tx, params) => createBoxTube(authType, tx, await req.formData(), await parseParamId(params.id))
)
