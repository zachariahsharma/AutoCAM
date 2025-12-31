import { TeamInvites } from "@/lib/db/schema/entities";
import { registry } from "@/lib/openapi/registry";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import zod from "zod";
import { CommonAuthorization, ValidationError } from "../codes";
import { apiKey, userSession } from "../auth";
import { scopeNames as scopes } from "@/lib/scopes";

export const InvitesCreateSchema = createInsertSchema(TeamInvites);
export const Invite = createSelectSchema(TeamInvites).meta({ id: "Team Invite" });

registry.registerPath({
  method: "get",
  path: "/api/teams/{id}/invites",
  tags: ["Team Invites"],
  summary: "Get Team Invites (User)",
  security: [{ [userSession.name]: [] }],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) })
  },
  responses: {
    200: {
      description: "Returns the pending team invites",
      content: {
        "application/json": {
          schema: zod.array(Invite)
        }
      }
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "get",
  path: "/api/teams/invites",
  tags: ["Team Invites"],
  summary: "Get Team Invites (API Key)",
  security: [{ [apiKey.name]: [scopes.teams.invites.read] }],
  responses: {
    200: {
      description: "Returns the pending team invites",
      content: {
        "application/json": {
          schema: zod.array(Invite)
        }
      }
    },
    ...CommonAuthorization,
  }
});

registry.registerPath({
  method: "post",
  path: "/api/teams/{id}/invites",
  tags: ["Team Invites"],
  summary: "Send Team Invite (User)",
  security: [{ [userSession.name]: [] }],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) })
  },
  responses: {
    204: {
      description: "Team invite sent successfully"
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "post",
  path: "/api/teams/invites",
  tags: ["Team Invites"],
  summary: "Send Team Invite (API Key)",
  security: [{ [apiKey.name]: [scopes.teams.invites.send] }],
  responses: {
    204: {
      description: "Team invite sent successfully"
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});
