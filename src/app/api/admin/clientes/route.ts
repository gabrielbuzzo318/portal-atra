import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requireRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/admin/clientes  -> lista clientes
export async function GET() {
  try {
    const user = getAuthUser();
    requireRole(user, ['ACCOUNTANT']); // só a Ester vê isso

    // pega todo mundo que NÃO é contador
    const clients = await prisma.user.findMany({
      where: {
        NOT: {
          role: 'ACCOUNTANT',
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ clients });
  } catch (err) {
    console.error('Erro ao listar clientes:', err);
    return NextResponse.json(
      { error: 'Erro ao listar clientes' },
      { status: 500 },
    );
  }
}

// POST /api/admin/clientes  -> cria cliente novo
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser();
    requireRole(user, ['ACCOUNTANT']); // só a Ester cria cliente

    const body = await req.json();

    const name = (body.name || body.nome) as string | undefined;
    const email = body.email as string | undefined;

    const senhaBruta =
      (body.initialPassword ||
        body.password ||
        body.senhaInicial ||
        body.senha) as string | undefined;

    if (!name || !email || !senhaBruta) {
      console.log('Body recebido em /api/admin/clientes POST:', body);
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um cliente com este e-mail' },
        { status: 409 },
      );
    }

    const hash = await bcrypt.hash(senhaBruta, 10);

    const client = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hash,
        // se o role do schema for enum, a gente assumiu que 'CLIENT' é aceitável;
        // mas como o GET pega "todo mundo que não é ACCOUNTANT",
        // mesmo que salve outro valor o cliente aparece.
        role: 'CLIENT',
      },
    });

    return NextResponse.json(
      { client },
      { status: 201 },
    );
  } catch (err) {
    console.error('Erro ao criar cliente:', err);
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 },
    );
  }
}
