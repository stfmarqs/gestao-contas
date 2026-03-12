import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, notFound, parseId, serverError } from "@/lib/http";
import path from "path";
import { readFile } from "fs/promises";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const invoiceId = parseId(params.id);
    const attachmentId = parseId(params.attachmentId);

    if (!invoiceId || !attachmentId) {
      return badRequest("ID inválido");
    }

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, invoiceId }
    });

    if (!attachment) {
      return notFound("Anexo não encontrado");
    }

    const fullPath = path.join(process.cwd(), "uploads", attachment.filename);
    const file = await readFile(fullPath);

    return new NextResponse(file, {
      headers: {
        "content-type": attachment.mimeType,
        "content-disposition": `attachment; filename="${attachment.originalName}"`
      }
    });
  } catch {
    return serverError("Falha ao baixar anexo");
  }
}


