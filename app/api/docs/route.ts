import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { registry } from "@/lib/openapi/registry";
import { ApiReference } from "@scalar/nextjs-api-reference";
import "@/lib/api";

const generator = new OpenApiGeneratorV31(registry.definitions);
export const GET = ApiReference({
  content: JSON.stringify(generator.generateDocument({
    openapi: "3.1.2",
    info: {
      version: "1.0.0",
      title: "AutoCAM"
    }
  }))
});