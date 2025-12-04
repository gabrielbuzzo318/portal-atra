import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = "ester@contabilidade.com";
  const password = "123456";

  const hashed = await bcrypt.hash(password, 10);

  // Criar usuária se não existir
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    await prisma.user.create({
      data: {
        name: "Ester Contabilidade",
        email,
        password: hashed,
        role: "ACCOUNTANT"
      }
    });
    console.log("Usuária Ester criada!");
  } else {
    console.log("Usuária Ester já existe.");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
