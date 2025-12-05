import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requireRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/admin/clientes  -> lista clientes
export async function GET() {
  try {
    const user = getAuthUser();
    requireRole(user, ['ACCOUNTANT']); // só a Ester vê isso

    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
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
    const {
      name,
      email,
      initialPassword,
    } = body as {
      name: string;
      email: string;
      initialPassword: string;
    };

    if (!name || !email || !initialPassword) {
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

    const hash = await bcrypt.hash(initialPassword, 10);

    const client = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hash,
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
