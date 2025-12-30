import { TeamsCreateSchema, TeamsGetSchema } from "@/lib/api/teams";
import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { NextResponse } from "next/server";
import { registry } from "@/lib/openapi/registry";
import "@/lib/api";

export async function GET() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return NextResponse.json(generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "AutoCAM",
    }
  }))
}