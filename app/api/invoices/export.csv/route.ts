import { NextRequest, NextResponse } from "next/server";
import { listInvoices } from "@/lib/services/invoice-service";
import { formatCurrency, formatDatePt } from "@/lib/date";
import { toCsv } from "@/lib/csv";
import { serverError } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const invoices = await listInvoices({
      companyId: searchParams.get("companyId") ? Number(searchParams.get("companyId")) : undefined,
      search: searchParams.get("search") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      status:
        searchParams.get("status") === "paid" ||
        searchParams.get("status") === "pending" ||
        searchParams.get("status") === "overdue"
          ? (searchParams.get("status") as "paid" | "pending" | "overdue")
          : undefined,
      dueFrom: searchParams.get("dueFrom") ? new Date(searchParams.get("dueFrom") as string) : undefined,
      dueTo: searchParams.get("dueTo") ? new Date(searchParams.get("dueTo") as string) : undefined
    });

    const headers = [
      "ID",
      "Fornecedor",
      "Empresa",
      "CNPJ",
      "Categoria",
      "Valor",
      "Emissão",
      "Vencimento",
      "Status"
    ];

    const rows = invoices.map((invoice) => [
      String(invoice.id),
      invoice.supplierName,
      invoice.companyName,
      invoice.companyCnpj,
      invoice.category,
      formatCurrency(invoice.amount),
      formatDatePt(invoice.issueDate),
      formatDatePt(invoice.dueDate),
      invoice.status
    ]);

    const csv = toCsv(headers, rows);

    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=invoices.csv"
      }
    });
  } catch {
    return serverError("Falha ao exportar CSV");
  }
}


