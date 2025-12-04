import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const COOKIE_NAME = 'auth_token';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'ACCOUNTANT' | 'CLIENT';
};

export async function login(email: string, password: string): Promise<AuthUser | null> {
  // busca usuário pelo e-mail
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  // compara a senha com o HASH SALVO EM passwordHash
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return null;
  }

  const payload: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as 'ACCOUNTANT' | 'CLIENT',
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });

  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  return payload;
}

export function getAuthUser(): AuthUser | null {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}

export function requireRole(
  user: AuthUser | null,
  roles: Array<AuthUser['role']>,
) {
  if (!user || !roles.includes(user.role)) {
    throw new Error('UNAUTHORIZED');
  }
}

export function requireAuth(): AuthUser {
  const user = getAuthUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export function logout() {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
