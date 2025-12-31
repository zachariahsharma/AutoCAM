import { getInvites, inviteEmail } from "../../invites/route";
import { routeFactory } from "@/lib/api";

export const POST = routeFactory(async (req, authType, tx, id) => inviteEmail(authType, tx, await req.json(), id));

export const GET = routeFactory(async (req, authType, tx, id) => getInvites(authType, tx, id))