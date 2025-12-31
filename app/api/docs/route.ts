import { ApiReference } from "@scalar/nextjs-api-reference";

export const GET = ApiReference({
  sources: [
    { url: "/api/docs/openapi", title: "AutoCAM" },
    { url: "/api/auth/open-api/generate-schema", title: "Auth" }
  ]
});