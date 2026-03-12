import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, notFound, parseId, serverError } from "@/lib/http";
import { webhookSchema } from "@/lib/validators";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseId(params.id);
    if (!id) return badRequest("ID inválido");

    const parsed = webhookSchema.safeParse(await request.json());
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Payload inválido");
    }

    const updated = await prisma.webhook.update({
      where: { id },
      data: {
        name: parsed.data.name,
        url: parsed.data.url,
        events: JSON.stringify(parsed.data.events),
        active: parsed.data.active ?? true,
        lastTriggerAt: parsed.data.lastTriggerAt ? new Date(parsed.data.lastTriggerAt) : null
      }
    }).catch(() => null);

    if (!updated) return notFound("Webhook não encontrado");

    return NextResponse.json({
      ...updated,
      events: JSON.parse(updated.events) as string[],
      lastTriggerAt: updated.lastTriggerAt ? updated.lastTriggerAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    });
  } catch {
    return serverError();
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseId(params.id);
    if (!id) return badRequest("ID inválido");

    const body = await request.json();
    const partial = webhookSchema.partial();
    const parsed = partial.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Payload inválido");
    }

    const updated = await prisma.webhook.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.url !== undefined ? { url: parsed.data.url } : {}),
        ...(parsed.data.events !== undefined ? { events: JSON.stringify(parsed.data.events) } : {}),
        ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
        ...(parsed.data.lastTriggerAt !== undefined
          ? { lastTriggerAt: parsed.data.lastTriggerAt ? new Date(parsed.data.lastTriggerAt) : null }
          : {})
      }
    }).catch(() => null);

    if (!updated) return notFound("Webhook não encontrado");

    return NextResponse.json({
      ...updated,
      events: JSON.parse(updated.events) as string[],
      lastTriggerAt: updated.lastTriggerAt ? updated.lastTriggerAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    });
  } catch {
    return serverError();
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseId(params.id);
    if (!id) return badRequest("ID inválido");

    const deleted = await prisma.webhook.delete({ where: { id } }).catch(() => null);
    if (!deleted) return notFound("Webhook não encontrado");

    return new NextResponse(null, { status: 204 });
  } catch {
    return serverError();
  }
}


