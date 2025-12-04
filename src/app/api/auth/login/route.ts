import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 },
      );
    }

    const user = await login(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'E-mail ou senha inválidos' },
        { status: 401 },
      );
    }

    // login() já setou o cookie, aqui só devolvemos o user
    return NextResponse.json({ user });
  } catch (e) {
    console.error('Erro no login:', e);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 },
    );
  }
}
