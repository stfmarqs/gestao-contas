import { prisma } from "@/lib/db";

export type InvoiceWebhookEvent = "invoice.created" | "invoice.updated" | "invoice.overdue" | "invoice.paid";

export async function dispatchInvoiceWebhooks(payload: {
  event: InvoiceWebhookEvent;
  invoiceId: number;
  companyId: number;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
}) {
  const hooks = await prisma.webhook.findMany({ where: { active: true } });
  const timestamp = new Date().toISOString();

  const relevant = hooks.filter((hook) => {
    let events: string[] = [];
    try {
      events = JSON.parse(hook.events) as string[];
    } catch {
      events = [];
    }
    return events.includes(payload.event);
  });

  await Promise.all(
    relevant.map(async (hook) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      try {
        const response = await fetch(hook.url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...payload, timestamp }),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Webhook ${hook.id} retornou status ${response.status}`);
        }

        await prisma.webhook.update({
          where: { id: hook.id },
          data: { lastTriggerAt: new Date() }
        });
      } finally {
        clearTimeout(timeout);
      }
    })
  );
}


