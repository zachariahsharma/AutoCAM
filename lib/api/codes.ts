import { ResponseConfig } from "@asteasolutions/zod-to-openapi";
import zod from "zod";

export const CommonAuthorization: Record<string, ResponseConfig> = {
  401: {
    description: "Unauthorized. Due to missing or invalid authentication"
  },
  403: {
    description: "Forbidden. You do not have permission to access this resource or perform this action. This includes not having your email verified"
  }
};

export const NotFound: Record<string, ResponseConfig> = {
  404: {
    description: "Not Found. The requested resource was not found."
  }
}

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