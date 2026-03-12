import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, serverError } from "@/lib/http";
import { supplierSchema } from "@/lib/validators";

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(suppliers);
  } catch {
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = supplierSchema.safeParse(await request.json());
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Payload inválido");
    }

    const supplier = await prisma.supplier.create({
      data: {
        ...parsed.data,
        active: parsed.data.active ?? true
      }
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch {
    return serverError();
  }
}


