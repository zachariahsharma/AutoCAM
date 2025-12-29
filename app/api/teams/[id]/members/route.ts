import { routeFactory } from "@/lib/api-utils";
import { getTeamMembers } from "../../members/route";

export const GET = routeFactory(async (req, authType, tx, id) => getTeamMembers(authType, tx, id))
