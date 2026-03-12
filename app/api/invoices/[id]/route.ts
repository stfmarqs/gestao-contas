import { NextRequest, NextResponse } from "next/server";
import { deleteInvoice, getInvoiceById, updateInvoice } from "@/lib/services/invoice-service";
import { badRequest, notFound, parseId, serverError } from "@/lib/http";
import { invoiceSchema } from "@/lib/validators";
import { dispatchInvoiceWebhooks } from "@/lib/services/webhook-service";
import { z } from "zod";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseId(params.id);
    if (!id) return badRequest("ID inválido");

    const invoice = await getInvoiceById(id);
    if (!invoice) return notFound("Fatura não encontrada");

    return NextResponse.json(invoice);
  } catch {
    return serverError();
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseId(params.id);
    if (!id) return badRequest("ID inválido");

    const parsed = invoiceSchema.safeParse(await request.json());
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Payload inválido");
    }

    const invoice = await updateInvoice(id, parsed.data);
    if (!invoice) return notFound("Fatura não encontrada");

    await dispatchInvoiceWebhooks({
      event: invoice.status === "paid" ? "invoice.paid" : invoice.status === "overdue" ? "invoice.overdue" : "invoice.updated",
      invoiceId: invoice.id,
      companyId: invoice.companyId,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      status: invoice.status
    }).catch(() => null);

    return NextResponse.json(invoice);
  } catch {
    return serverError();
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseId(params.id);
    if (!id) return badRequest("ID inválido");

    const body = await request.json();
    const partial = invoiceSchema
      .partial()
      .extend({
        status: z.enum(["paid", "pending", "overdue"]).optional()
      })
      .passthrough();
    const parsed = partial.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Payload inválido");
    }

    const status = body.status as "paid" | "pending" | "overdue" | undefined;
    const invoice = await updateInvoice(id, {
      ...parsed.data,
      status: status === "paid" || status === "pending" || status === "overdue" ? status : undefined
    });
    if (!invoice) return notFound("Fatura não encontrada");

    await dispatchInvoiceWebhooks({
      event: invoice.status === "paid" ? "invoice.paid" : invoice.status === "overdue" ? "invoice.overdue" : "invoice.updated",
      invoiceId: invoice.id,
      companyId: invoice.companyId,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      status: invoice.status
    }).catch(() => null);

    return NextResponse.json(invoice);
  } catch {
    return serverError();
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseId(params.id);
    if (!id) return badRequest("ID inválido");

    const deleted = await deleteInvoice(id);
    if (!deleted) return notFound("Fatura não encontrada");

    return new NextResponse(null, { status: 204 });
  } catch {
    return serverError();
  }
}


