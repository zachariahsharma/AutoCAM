import { ResponseConfig, RouteConfig } from "@asteasolutions/zod-to-openapi";
import zod, { ZodObject } from "zod";
import { registry } from "../openapi/registry";
import { apiKey, userSession } from "./auth";

export const CommonAuthorization: Record<string, ResponseConfig> = {
  401: {
    description: "Unauthorized. Due to missing or invalid authentication",
    content: {
      "application/json": {
        schema: zod.object({
          message: zod.string()
        })
      }
    }
  },
  403: {
    description: "Forbidden. You do not have permission to access this resource or perform this action. This includes not having your email verified",
    content: {
      "application/json": {
        schema: zod.object({
          message: zod.string()
        })
      }
    }
  }
};

export const NotFound: Record<string, ResponseConfig> = {
  404: {
    description: "Not Found. The requested resource was not found."
  }
}

export const Conflict: Record<string, ResponseConfig> = {
  409: {
    description: "There was a conflict with creating the requested resource."
  }
};

const ValidationIssue = zod.object({
  code: zod.string(),
  message: zod.string(),
}).meta({ id: "Validation Issue" })
export const ValidationError: Record<string, ResponseConfig> = {
  422: {
    description: "Unprocessable Entity. Usually due to missing or invalid parameters.",
    content: {
      "application/json": {
        schema: zod.array(ValidationIssue)
      }
    }
  }
};

/**
 * Register an endpoint that has two variants: /api/... and /api/teams/:id/...
 */
export function registerTeamEndpoint(scopes: string[], config: RouteConfig, userOverride?: object, apiKeyOverride?: object) {
  // API Key variant - this one is easier
  registry.registerPath({
    ...config,
    summary: config.summary ? config.summary + " (API Key)" : config.summary,
    security: [{ [apiKey.name]: scopes }],
    ...apiKeyOverride
  });

  let params: ZodObject = zod.object({ id: zod.number().meta({ description: "ID of the team" }) });
  if (config.request?.params)
    params = (config.request.params as ZodObject).extend(params);

  // User variant
  registry.registerPath({
    ...config,
    path: `/api/teams/{id}/${config.path.split("/api/").slice(1)}`,
    summary: config.summary ? config.summary + " (User)" : config.summary,
    security: [{ [userSession.name]: [] }],
    request: {
      ...config.request,
      params,
    },
    responses: {
      ...config.responses,
      ...ValidationError
    },
    ...userOverride
  })
}