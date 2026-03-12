"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import type { Attachment, InvoiceDetail } from "@/lib/types";
import { formatCurrency, formatDatePt } from "@/lib/date";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Erro inesperado" }))) as { error?: string };
    throw new Error(err.error ?? "Erro de requisicao");
  }
  return (await res.json()) as T;
}

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [inv, att] = await Promise.all([
        api<InvoiceDetail>(`/api/invoices/${params.id}`),
        api<Attachment[]>(`/api/invoices/${params.id}/attachments`)
      ]);
      setInvoice(inv);
      setAttachments(att);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch(`/api/invoices/${params.id}/attachments`, { method: "POST", body: data });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: "Falha no upload" }))) as { error?: string };
        throw new Error(err.error ?? "Falha no upload");
      }
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Carregando...
      </div>
    );
  }

  if (!invoice || error) {
    return (
      <div className="min-h-screen p-8">
        <p className="text-red-600">{error ?? "Fatura nao encontrada"}</p>
        <Link href="/" className="text-emerald-700 hover:underline">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/" className="text-sm text-emerald-700 hover:underline">
          â† Voltar
        </Link>
        <div className="bg-white border rounded-xl p-6">
          <h1 className="text-xl font-bold">Fatura #{invoice.id}</h1>
          <p className="text-slate-600 mt-1">
            {invoice.supplierName} â€¢ {invoice.companyName}
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-5 text-sm">
            <div>
              <p className="text-slate-500">Categoria</p>
              <p className="font-medium">{invoice.category}</p>
            </div>
            <div>
              <p className="text-slate-500">Emissao</p>
              <p className="font-medium">{formatDatePt(invoice.issueDate)}</p>
            </div>
            <div>
              <p className="text-slate-500">Vencimento</p>
              <p className="font-medium">{formatDatePt(invoice.dueDate)}</p>
            </div>
            <div>
              <p className="text-slate-500">Valor</p>
              <p className="font-medium">{formatCurrency(invoice.amount)}</p>
            </div>
            <div>
              <p className="text-slate-500">Status</p>
              <p className="font-medium">{invoice.status}</p>
            </div>
            <div>
              <p className="text-slate-500">Pago em</p>
              <p className="font-medium">{invoice.paidAt ? formatDatePt(invoice.paidAt) : "-"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Anexos</h2>
            <label className="btn cursor-pointer inline-flex items-center gap-1">
              <Upload className="w-4 h-4" />
              {uploading ? "Enviando..." : "Novo anexo"}
              <input type="file" className="hidden" onChange={upload} />
            </label>
          </div>
          <div className="mt-4 space-y-2">
            {attachments.length === 0 && <p className="text-sm text-slate-500">Sem anexos.</p>}
            {attachments.map((att) => (
              <div key={att.id} className="border rounded-lg px-3 py-2 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{att.originalName}</p>
                  <p className="text-xs text-slate-500">
                    {Math.round(att.size / 1024)} KB â€¢ {formatDatePt(att.createdAt)}
                  </p>
                </div>
                <a className="text-sm text-emerald-700 hover:underline inline-flex items-center gap-1" href={`/api/invoices/${invoice.id}/attachments/${att.id}/download`}>
                  <Download className="w-4 h-4" />
                  baixar
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


