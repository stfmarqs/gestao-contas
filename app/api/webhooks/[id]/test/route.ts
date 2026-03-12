import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, notFound, parseId } from "@/lib/http";
import { invoiceEventSchema } from "@/lib/validators";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return badRequest("ID inválido");

  const hook = await prisma.webhook.findUnique({ where: { id } });
  if (!hook) return notFound("Webhook não encontrado");

  const body = await request.json().catch(() => ({}));
  const eventParsed = invoiceEventSchema.safeParse(body.event ?? "invoice.updated");
  if (!eventParsed.success) {
    return badRequest("Evento inválido");
  }

  const payload = {
    event: eventParsed.data,
    timestamp: new Date().toISOString(),
    invoiceId: Number(body.invoiceId ?? 1),
    companyId: Number(body.companyId ?? 1),
    amount: Number(body.amount ?? 100),
    dueDate: String(body.dueDate ?? new Date().toISOString()),
    status: body.status === "paid" || body.status === "pending" || body.status === "overdue" ? body.status : "pending"
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(hook.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: `Webhook retornou ${response.status}` }, { status: 502 });
    }

    await prisma.webhook.update({ where: { id: hook.id }, data: { lastTriggerAt: new Date() } });

    return NextResponse.json({ ok: true, payload });
  } catch {
    return NextResponse.json({ ok: false, error: "Falha de envio ou timeout de webhook" }, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}


