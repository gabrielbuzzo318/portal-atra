import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requireRole } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser();
    requireRole(user, ['ACCOUNTANT']); // só a Ester envia docs

    const formData = await req.formData();

    const clientId = formData.get('clientId') as string | null;
    const rawType = formData.get('type') as string | null;
    const competenceRaw = formData.get('competence') as string | null;
    const file = formData.get('file') as File | null;

    if (!clientId || !file) {
      return NextResponse.json(
        { error: 'Dados inválidos para upload' },
        { status: 400 }
      );
    }

    // normaliza o tipo para o enum do Prisma: 'NF' | 'BOLETO' | 'OTHER'
    let type: 'NF' | 'BOLETO' | 'OTHER' = 'OTHER';

    if (rawType === 'NF' || rawType === 'BOLETO' || rawType === 'OTHER') {
      type = rawType;
    } else if (rawType?.toLowerCase().includes('nota')) {
      type = 'NF';
    } else if (rawType?.toLowerCase().includes('boleto')) {
      type = 'BOLETO';
    }

    // competência: se vier algo vazio ou "-------- de ----", ignora
    let competence: string | null = null;
    if (
      competenceRaw &&
      !competenceRaw.includes('----') &&
      competenceRaw.trim() !== ''
    ) {
      competence = competenceRaw;
    }

    // converte file em buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir =
      process.env.FILE_UPLOAD_DIR || path.join(process.cwd(), 'uploads');

    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || '';
    const randomName = crypto.randomBytes(16).toString('hex') + ext;
    const filePath = path.join(uploadDir, randomName);

    await writeFile(filePath, buffer);

    const doc = await prisma.document.create({
      data: {
        clientId,
        uploadedById: user!.id,
        type,                         // enum padronizado
        competence,                   // pode ser null se o campo no schema for opcional
        path: filePath,
        originalName: file.name,
      } as any,
    });

    return NextResponse.json({ ok: true, document: doc });
  } catch (err) {
    console.error('Erro no upload:', err);
    return NextResponse.json(
      { error: 'Erro ao enviar documento' },
      { status: 500 }
    );
  }
}
