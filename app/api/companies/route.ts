import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, serverError } from "@/lib/http";
import { companySchema } from "@/lib/validators";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(companies);
  } catch {
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = companySchema.safeParse(await request.json());
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Payload inválido");
    }

    const company = await prisma.company.create({ data: parsed.data });
    return NextResponse.json(company, { status: 201 });
  } catch {
    return serverError();
  }
}


