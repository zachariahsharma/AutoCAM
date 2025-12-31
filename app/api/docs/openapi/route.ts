import { registry } from "@/lib/openapi/registry";
import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { NextResponse } from "next/server";
import "@/lib/api";

export async function GET() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return NextResponse.json(generator.generateDocument({
    openapi: "3.1.2",
    info: {
      version: "1.0.0",
      title: "AutoCAM"
    }
  }));
}