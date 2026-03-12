import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, serverError } from "@/lib/http";
import { webhookSchema } from "@/lib/validators";

const parseEvents = (value: string): string[] => {
  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
};

export async function GET() {
  try {
    const webhooks = await prisma.webhook.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(
      webhooks.map((hook) => ({
        ...hook,
        events: parseEvents(hook.events),
        lastTriggerAt: hook.lastTriggerAt ? hook.lastTriggerAt.toISOString() : null,
        createdAt: hook.createdAt.toISOString(),
        updatedAt: hook.updatedAt.toISOString()
      }))
    );
  } catch {
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = webhookSchema.safeParse(await request.json());
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Payload invalido");
    }

    const webhook = await prisma.webhook.create({
      data: {
        name: parsed.data.name,
        url: parsed.data.url,
        events: JSON.stringify(parsed.data.events),
        active: parsed.data.active ?? true,
        lastTriggerAt: parsed.data.lastTriggerAt ? new Date(parsed.data.lastTriggerAt) : null
      }
    });

    return NextResponse.json(
      {
        ...webhook,
        events: parseEvents(webhook.events),
        lastTriggerAt: webhook.lastTriggerAt ? webhook.lastTriggerAt.toISOString() : null,
        createdAt: webhook.createdAt.toISOString(),
        updatedAt: webhook.updatedAt.toISOString()
      },
      { status: 201 }
    );
  } catch {
    return serverError();
  }
}