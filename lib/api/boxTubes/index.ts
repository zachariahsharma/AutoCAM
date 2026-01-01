import { BoxTubes } from "@/lib/db/schema/cam";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, userSession } from "../auth";
import { scopeNames as scopes } from "../../scopes";
import { CommonAuthorization, NotFound, ValidationError } from "../codes";
import { parseJsonBody, parseJsonFile, routeFactory, routeResponse } from "..";
import { teamIdFromDigest } from "../../auth/server";
import { eq } from "drizzle-orm";

import "./jobs";

const CreateSchema = createInsertSchema(BoxTubes).omit({ file: true, team_id: true });
const UpdateSchema = createUpdateSchema(BoxTubes).omit({ file: true, team_id: true });
const BoxTube = createSelectSchema(BoxTubes).omit({ file: true, team_id: true }).meta({ id: "Box Tube" });

registry.registerPath({
  method: "get",
  path: "/api/teams/{id}/boxTubes",
  tags: ["Box Tubes"],
  security: [{ [userSession.name]: [] }],
  summary: "Get Box Tubes (User)",
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) })
  },
  responses: {
    200: {
      description: "This endpoint returns the box tubes from the given team",
      content: {
        "application/json": {
          schema: zod.array(BoxTube)
        }
      }
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "get",
  path: "/api/boxTubes",
  tags: ["Box Tubes"],
  security: [{ [apiKey.name]: [scopes.boxTubes.read] }],
  summary: "Get Box Tubes (API Key)",
  responses: {
    200: {
      description: "This endpoint returns the box tubes from the API Key's team",
      content: {
        "application/json": {
          schema: zod.array(BoxTube)
        }
      }
    },
    ...CommonAuthorization
  }
});

registry.registerPath({
  method: "post",
  path: "/api/teams/{id}/boxTubes",
  tags: ["Box Tubes"],
  summary: "Create Box Tube (User)",
  description: "This endpoint requires the user's email to be verified",
  security: [{ [userSession.name]: [] }],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the team" }) }),
    body: {
      content: {
        "multipart/form-data": {
          schema: zod.object({
            data: CreateSchema.meta({ description: "Box tube info as stringified JSON" }),
            file: zod.instanceof(File).openapi({ type: "string", format: "binary", description: "Box tube file upload" })
          }),
        }
      }
    }
  },
  responses: {
    201: {
      description: "Returns the ID of the created box tube",
      content: {
        "application/json": {
          schema: zod.object({ id: zod.number() })
        }
      }
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "post",
  path: "/api/boxTubes",
  tags: ["Box Tubes"],
  summary: "Create Box Tube (API Key)",
  security: [{ [apiKey.name]: [scopes.boxTubes.write] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: zod.object({
            data: CreateSchema.meta({ description: "Box tube info as stringified JSON" }),
            file: zod.instanceof(File).openapi({ type: "string", format: "binary", description: "Box tube file upload" })
          }),
        }
      }
    }
  },
  responses: {
    201: {
      description: "Returns the ID of the created box tube",
      content: {
        "application/json": {
          schema: zod.object({ id: zod.number() })
        }
      }
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "patch",
  path: "/api/boxTubes/{id}",
  tags: ["Box Tubes"],
  summary: "Update Box Tube",
  description: "This endpoint requires the user's email to be verified",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.boxTubes.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the box tube" }) }),
    body: {
      content: {
        "application/json": {
          schema: UpdateSchema
        }
      }
    }
  },
  responses: {
    204: {
      description: "Box tube updated successfully",
    },
    ...CommonAuthorization,
    ...ValidationError,
    ...NotFound
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/boxTubes/{id}",
  tags: ["Box Tubes"],
  summary: "Delete Box Tube",
  description: "This endpoint requires the user's email to be verified",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.boxTubes.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the box tube" }) }),
  },
  responses: {
    204: {
      description: "Box tube deleted successfully",
    },
    ...CommonAuthorization,
    ...ValidationError,
    ...NotFound
  }
});

export const GET = routeFactory(async (req, authType, tx, teamId) => {
  teamId ??= await teamIdFromDigest(tx, authType);

  return routeResponse(200, await parseJsonBody(await tx.query.BoxTubes.findMany({
    where: eq(BoxTubes.team_id, teamId)
  }), zod.array(BoxTube)));
});

export const POST = routeFactory(async (req, authType, tx, team_id) => {
  team_id ??= await teamIdFromDigest(tx, authType);

  const { data, file } = await parseJsonFile(await req.formData(), CreateSchema);

  const [id] = await tx.insert(BoxTubes).values({ ...data, file, team_id }).returning({ id: BoxTubes.id });
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true })

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const body = await parseJsonBody(await req.json(), UpdateSchema);
  return tx.update(BoxTubes).set(body).where(eq(BoxTubes.id, id)).returning({ id: BoxTubes.id });
}, { emailVerifiedNeeded: true });

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  return tx.delete(BoxTubes).where(eq(BoxTubes.id, id)).returning({ id: BoxTubes.id });
}, { emailVerifiedNeeded: true });