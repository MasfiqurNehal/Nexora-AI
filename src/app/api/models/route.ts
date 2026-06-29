import { NextResponse } from "next/server";

import { fetchOpenWebUIModels, getOpenWebUIConfig } from "@/lib/openwebui";

export const runtime = "nodejs";

export async function GET() {
  try {
    const config = getOpenWebUIConfig();
    const models = await fetchOpenWebUIModels(config);

    return NextResponse.json({
      models,
      defaultModel: config.defaultModel ?? models[0]?.id ?? ""
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load models."
      },
      { status: 500 }
    );
  }
}
