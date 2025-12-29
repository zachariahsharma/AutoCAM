import { parseParamId, routeFactory } from "@/lib/api-utils";
import { getTeamMembers } from "../../members/route";
import { Params } from "../route";

export const GET = routeFactory<Params>(
  async (req, authType, tx, params) => getTeamMembers(authType, tx, await parseParamId(params.id))
)
