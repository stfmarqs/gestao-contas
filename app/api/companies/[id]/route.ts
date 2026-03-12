import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, notFound, parseId, serverError } from "@/lib/http";
import { companySchema } from "@/lib/validators";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseId(params.id);
    if (!id) return badRequest("ID inválido");

    const parsed = companySchema.safeParse(await request.json());
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Payload inválido");
    }

    const updated = await prisma.company.update({ where: { id }, data: parsed.data }).catch(() => null);
    if (!updated) return notFound("Empresa não encontrada");

    return NextResponse.json(updated);
  } catch {
    return serverError();
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseId(params.id);
    if (!id) return badRequest("ID inválido");

    const body = await request.json();
    const partialSchema = companySchema.partial();
    const parsed = partialSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Payload inválido");
    }

    const updated = await prisma.company.update({ where: { id }, data: parsed.data }).catch(() => null);
    if (!updated) return notFound("Empresa não encontrada");

    return NextResponse.json(updated);
  } catch {
    return serverError();
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseId(params.id);
    if (!id) return badRequest("ID inválido");

    const deleted = await prisma.company.delete({ where: { id } }).catch(() => null);
    if (!deleted) return notFound("Empresa não encontrada");

    return new NextResponse(null, { status: 204 });
  } catch {
    return badRequest("Não foi possível excluir a empresa (pode haver faturas vinculadas)");
  }
}


