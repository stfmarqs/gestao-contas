import { NextRequest, NextResponse } from "next/server";
import { listInvoices, createInvoice, listInvoicesForDashboard, isInvoiceOverdue } from "@/lib/services/invoice-service";
import { badRequest, serverError } from "@/lib/http";
import { invoiceSchema } from "@/lib/validators";
import { dispatchInvoiceWebhooks } from "@/lib/services/webhook-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const supplierId = searchParams.get("supplierId");
    const status = searchParams.get("status");
    const search = searchParams.get("search") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const dueFrom = searchParams.get("dueFrom");
    const dueTo = searchParams.get("dueTo");
    const dashboard = searchParams.get("dashboard") === "1";

    if (dashboard) {
      const dashboardData = await listInvoicesForDashboard(companyId ? Number(companyId) : undefined);
      return NextResponse.json(dashboardData);
    }

    const invoices = await listInvoices({
      companyId: companyId ? Number(companyId) : undefined,
      supplierId: supplierId ? Number(supplierId) : undefined,
      search,
      category,
      status: status === "paid" || status === "pending" || status === "overdue" ? status : undefined,
      dueFrom: dueFrom ? new Date(dueFrom) : undefined,
      dueTo: dueTo ? new Date(dueTo) : undefined
    });

    return NextResponse.json(invoices);
  } catch {
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = invoiceSchema.safeParse(payload);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Payload inválido");
    }

    const invoice = await createInvoice(parsed.data);

    const event = isInvoiceOverdue(invoice) ? "invoice.overdue" : "invoice.created";
    await dispatchInvoiceWebhooks({
      event,
      invoiceId: invoice.id,
      companyId: invoice.companyId,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      status: invoice.status
    }).catch(() => null);

    return NextResponse.json(invoice, { status: 201 });
  } catch {
    return serverError();
  }
}


