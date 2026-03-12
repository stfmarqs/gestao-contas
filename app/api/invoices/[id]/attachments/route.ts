import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseId, badRequest, notFound, serverError } from "@/lib/http";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import crypto from "crypto";

const uploadsDir = path.join(process.cwd(), "uploads");

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoiceId = parseId(params.id);
    if (!invoiceId) return badRequest("ID inválido");

    const exists = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { id: true } });
    if (!exists) return notFound("Fatura não encontrada");

    const attachments = await prisma.attachment.findMany({
      where: { invoiceId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(
      attachments.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString()
      }))
    );
  } catch {
    return serverError();
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoiceId = parseId(params.id);
    if (!invoiceId) return badRequest("ID inválido");

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { id: true } });
    if (!invoice) return notFound("Fatura não encontrada");

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return badRequest("Arquivo não enviado");
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeOriginal = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const filename = `${Date.now()}-${crypto.randomUUID()}-${safeOriginal}`;

    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), bytes);

    const attachment = await prisma.attachment.create({
      data: {
        invoiceId,
        filename,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: bytes.byteLength
      }
    });

    return NextResponse.json(
      {
        ...attachment,
        createdAt: attachment.createdAt.toISOString()
      },
      { status: 201 }
    );
  } catch {
    return serverError("Falha ao processar upload do anexo");
  }
}


