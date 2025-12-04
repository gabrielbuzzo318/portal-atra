import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const user = getAuthUser();
  try {
    requireRole(user, ['ACCOUNTANT']);
  } catch (e) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const clientId = formData.get('clientId') as string;
  const type = (formData.get('type') as string) || 'OTHER';
  const rawCompetencia = formData.get('competencia') as string | null;

  if (!file || !clientId) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
  }

  // normaliza competência: vem "YYYY-MM" do input type="month"
  let competencia: string | null = null;
  if (rawCompetencia && rawCompetencia.trim() !== '') {
    // se vier "YYYY-MM" já serve
    competencia = rawCompetencia.trim();
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = process.env.FILE_UPLOAD_DIR || './uploads';
  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name) || '';
  const randomName = crypto.randomBytes(16).toString('hex') + ext;
  const filePath = path.join(uploadDir, randomName);

  await writeFile(filePath, buffer);

  const doc = await prisma.document.create({
    data: {
      clientId,
      uploadedById: user!.id,
      type,
      originalName: file.name,
      storedName: randomName,
      path: filePath,
      competencia: competencia ?? undefined,
    },
  });

  return NextResponse.json({ document: doc });
}
