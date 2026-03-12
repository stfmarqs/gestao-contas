"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, Clock, Download, FileText, LayoutDashboard, Loader2, Plus, Search, Users, Webhook, X } from "lucide-react";
import type { ApiInvoice, Company, DashboardStats, InvoiceStatus, Supplier, Webhook as Hook } from "@/lib/types";
import { formatCurrency, formatDatePt } from "@/lib/date";

type Tab = "dashboard" | "invoices" | "suppliers" | "companies" | "contracts" | "webhooks";

const badge: Record<InvoiceStatus, string> = {
  paid: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  overdue: "bg-red-100 text-red-800 border-red-200"
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) }
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Erro inesperado" }))) as { error?: string };
    throw new Error(err.error ?? "Erro de requisicao");
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function MainApp() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [webhooks, setWebhooks] = useState<Hook[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ overdue: 0, pending30d: 0, paidMonth: 0, countOverdue: 0 });
  const [companyFilter, setCompanyFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [openInvoice, setOpenInvoice] = useState(false);
  const [openSupplier, setOpenSupplier] = useState(false);
  const [openCompany, setOpenCompany] = useState(false);
  const [invForm, setInvForm] = useState({ supplierId: "", companyId: "", category: "Outros", amount: "", issueDate: "", dueDate: "", notes: "" });
  const [supForm, setSupForm] = useState({ name: "", category: "Outros", contact: "", email: "" });
  const [comForm, setComForm] = useState({ name: "", cnpj: "" });

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [c, s, i, w, d] = await Promise.all([
        api<Company[]>("/api/companies"),
        api<Supplier[]>("/api/suppliers"),
        api<ApiInvoice[]>(`/api/invoices${companyFilter !== "all" ? `?companyId=${companyFilter}` : ""}`),
        api<Hook[]>("/api/webhooks"),
        api<{ stats: DashboardStats }>("/api/invoices?dashboard=1")
      ]);
      setCompanies(c);
      setSuppliers(s);
      setInvoices(i);
      setWebhooks(w);
      setStats(d.stats);
      if (!invForm.companyId && c[0]) setInvForm((prev) => ({ ...prev, companyId: String(c[0].id) }));
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyFilter]);

  const filteredInvoices = useMemo(() => invoices.filter((i) => !search || i.supplierName.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase())), [invoices, search]);
  const filteredSuppliers = useMemo(() => suppliers.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())), [suppliers, search]);

  const createInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    await api<ApiInvoice>("/api/invoices", { method: "POST", body: JSON.stringify({ supplierId: Number(invForm.supplierId), companyId: Number(invForm.companyId), category: invForm.category, amount: Number(invForm.amount), issueDate: invForm.issueDate, dueDate: invForm.dueDate, notes: invForm.notes || null }) });
    setOpenInvoice(false);
    notify("Fatura criada");
    await load();
  };

  const createSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    await api<Supplier>("/api/suppliers", { method: "POST", body: JSON.stringify({ ...supForm, contact: supForm.contact || null, email: supForm.email || null, active: true }) });
    setOpenSupplier(false);
    notify("Fornecedor criado");
    await load();
  };

  const createCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    await api<Company>("/api/companies", { method: "POST", body: JSON.stringify(comForm) });
    setOpenCompany(false);
    notify("Empresa criada");
    await load();
  };

  const updateStatus = async (id: number, status: InvoiceStatus) => {
    await api(`/api/invoices/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    notify("Status atualizado");
    await load();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-600"><Loader2 className="w-5 h-5 animate-spin mr-2" />Carregando...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {toast && <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-2 rounded-lg z-50">{toast}</div>}
      {openInvoice && <Modal title="Nova Fatura" close={() => setOpenInvoice(false)}><form onSubmit={createInvoice} className="space-y-3"><select required className="input" value={invForm.supplierId} onChange={(e) => setInvForm({ ...invForm, supplierId: e.target.value })}><option value="">Fornecedor</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select required className="input" value={invForm.companyId} onChange={(e) => setInvForm({ ...invForm, companyId: e.target.value })}><option value="">Empresa</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input required className="input" placeholder="Categoria" value={invForm.category} onChange={(e) => setInvForm({ ...invForm, category: e.target.value })} /><input required type="number" step="0.01" className="input" placeholder="Valor" value={invForm.amount} onChange={(e) => setInvForm({ ...invForm, amount: e.target.value })} /><div className="grid grid-cols-2 gap-3"><input required type="date" className="input" value={invForm.issueDate} onChange={(e) => setInvForm({ ...invForm, issueDate: e.target.value })} /><input required type="date" className="input" value={invForm.dueDate} onChange={(e) => setInvForm({ ...invForm, dueDate: e.target.value })} /></div><textarea className="input" placeholder="Notas" value={invForm.notes} onChange={(e) => setInvForm({ ...invForm, notes: e.target.value })} /><button className="btn">Salvar</button></form></Modal>}
      {openSupplier && <Modal title="Novo Fornecedor" close={() => setOpenSupplier(false)}><form onSubmit={createSupplier} className="space-y-3"><input required className="input" placeholder="Nome" value={supForm.name} onChange={(e) => setSupForm({ ...supForm, name: e.target.value })} /><input required className="input" placeholder="Categoria" value={supForm.category} onChange={(e) => setSupForm({ ...supForm, category: e.target.value })} /><input className="input" placeholder="Contato" value={supForm.contact} onChange={(e) => setSupForm({ ...supForm, contact: e.target.value })} /><input type="email" className="input" placeholder="Email" value={supForm.email} onChange={(e) => setSupForm({ ...supForm, email: e.target.value })} /><button className="btn">Salvar</button></form></Modal>}
      {openCompany && <Modal title="Nova Empresa" close={() => setOpenCompany(false)}><form onSubmit={createCompany} className="space-y-3"><input required className="input" placeholder="Nome" value={comForm.name} onChange={(e) => setComForm({ ...comForm, name: e.target.value })} /><input required className="input" placeholder="CNPJ" value={comForm.cnpj} onChange={(e) => setComForm({ ...comForm, cnpj: e.target.value })} /><button className="btn">Salvar</button></form></Modal>}

      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-700"><h1 className="text-lg font-bold text-white flex items-center gap-2"><Building2 className="w-6 h-6 text-emerald-500" />Gestao de Contas</h1><p className="text-xs text-emerald-500 mt-1 ml-8">LOCKS</p></div>
        <nav className="p-4 space-y-1">{(["dashboard","invoices","suppliers","companies","contracts","webhooks"] as Tab[]).map((t) => <button key={t} onClick={() => setTab(t)} className={`w-full text-left px-4 py-2 rounded-lg ${tab===t?"bg-emerald-600 text-white":"hover:bg-slate-800"}`}>{t}</button>)}</nav>
      </aside>

      <main className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center"><h2 className="text-xl font-semibold capitalize">{tab}</h2><button onClick={() => setOpenInvoice(true)} className="btn inline-flex items-center gap-1"><Plus className="w-4 h-4" />Nova Despesa</button></div>

        {tab === "dashboard" && <div className="grid md:grid-cols-3 gap-4"><Card title="Vencidos" value={formatCurrency(stats.overdue)} icon={<Clock className="w-5 h-5" />} /><Card title="A pagar 30d" value={formatCurrency(stats.pending30d)} icon={<LayoutDashboard className="w-5 h-5" />} /><Card title="Pago no mes" value={formatCurrency(stats.paidMonth)} icon={<CheckCircle2 className="w-5 h-5" />} /></div>}

        {tab === "invoices" && (
          <div className="space-y-4">
            <div className="bg-white border rounded-xl p-4 flex flex-wrap gap-3 items-center">
              <div className="relative"><Search className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" /><input className="input pl-8" placeholder="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
              <select className="input" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}><option value="all">Todas empresas</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <button className="px-3 py-2 border rounded-lg text-sm inline-flex items-center gap-1" onClick={() => { const p = new URLSearchParams(); if (companyFilter !== "all") p.set("companyId", companyFilter); if (search) p.set("search", search); window.location.href = `/api/invoices/export.csv?${p.toString()}`; }}><Download className="w-4 h-4" />Exportar</button>
            </div>
            <div className="bg-white border rounded-xl overflow-x-auto">
              <table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="p-3 text-left">Fornecedor</th><th className="p-3 text-left">Empresa</th><th className="p-3 text-left">Venc.</th><th className="p-3 text-left">Valor</th><th className="p-3 text-left">Status</th><th className="p-3 text-right">Acao</th></tr></thead><tbody>{filteredInvoices.map((i) => <tr key={i.id} className="border-t"><td className="p-3"><Link href={`/invoices/${i.id}`} className="font-medium hover:text-emerald-700">{i.supplierName}</Link><p className="text-xs text-slate-500">{i.category}</p></td><td className="p-3">{i.companyName}</td><td className="p-3">{formatDatePt(i.dueDate)}</td><td className="p-3">{formatCurrency(i.amount)}</td><td className="p-3"><span className={`px-2 py-0.5 text-xs border rounded-full ${badge[i.status]}`}>{i.status}</span></td><td className="p-3 text-right"><select className="input py-1" value={i.status} onChange={(e) => updateStatus(i.id, e.target.value as InvoiceStatus)}><option value="pending">Pendente</option><option value="paid">Pago</option><option value="overdue">Atrasado</option></select></td></tr>)}</tbody></table>
            </div>
          </div>
        )}

        {tab === "suppliers" && <div className="space-y-4"><button className="btn" onClick={() => setOpenSupplier(true)}><Plus className="w-4 h-4 inline mr-1" />Novo Fornecedor</button><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{filteredSuppliers.map((s) => <div key={s.id} className="bg-white border rounded-xl p-4"><p className="font-semibold">{s.name}</p><p className="text-xs text-slate-500">{s.category}</p><p className="text-sm mt-2">{s.contact || "-"}</p><p className="text-sm">{s.email || "-"}</p></div>)}</div></div>}
        {tab === "companies" && <div className="space-y-4"><button className="btn" onClick={() => setOpenCompany(true)}><Plus className="w-4 h-4 inline mr-1" />Nova Empresa</button><div className="bg-white border rounded-xl overflow-hidden"><table className="w-full"><thead className="bg-slate-50"><tr><th className="p-3 text-left">Nome</th><th className="p-3 text-left">CNPJ</th></tr></thead><tbody>{companies.map((c) => <tr key={c.id} className="border-t"><td className="p-3">{c.name}</td><td className="p-3">{c.cnpj}</td></tr>)}</tbody></table></div></div>}
        {tab === "webhooks" && <div className="grid gap-3">{webhooks.map((w) => <div key={w.id} className="bg-white border rounded-xl p-4 flex justify-between"><div><p className="font-semibold inline-flex items-center gap-1"><Webhook className="w-4 h-4" />{w.name}</p><p className="text-xs text-slate-500">{w.url}</p><p className="text-xs text-slate-500">Eventos: {w.events.join(", ")}</p></div><div className="space-y-2"><button className="px-3 py-1 border rounded text-sm" onClick={async () => { await api(`/api/webhooks/${w.id}/test`, { method: "POST", body: JSON.stringify({ event: "invoice.updated" }) }); notify("Webhook testado"); }}>Testar</button><button className="px-3 py-1 border rounded text-sm block" onClick={async () => { await api(`/api/webhooks/${w.id}`, { method: "PATCH", body: JSON.stringify({ active: !w.active }) }); await load(); }}> {w.active ? "Desativar" : "Ativar"} </button></div></div>)}</div>}
        {tab === "contracts" && <div className="bg-white border border-dashed rounded-xl p-10 text-center text-slate-500">Gestao de recorrencia fora do MVP.</div>}
      </main>
    </div>
  );
}

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="p-4 border-b flex justify-between items-center"><h3 className="font-semibold">{title}</h3><button onClick={close}><X className="w-4 h-4" /></button></div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function Card({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <div className="bg-white border rounded-xl p-4"><p className="text-xs text-slate-500">{title}</p><p className="text-xl font-bold mt-1">{value}</p><div className="mt-3 text-emerald-600">{icon}</div></div>;
}


