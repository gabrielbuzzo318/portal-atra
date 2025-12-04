import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromEmail = process.env.MAIL_FROM || 'nao-responda@atra.com.br';

if (!smtpHost || !smtpUser || !smtpPass) {
  console.warn(
    '[mail] SMTP não configurado. E-mails não serão enviados em produção.',
  );
}

const transporter =
  smtpHost && smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // 465 = SSL
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })
    : null;

export async function sendDocumentEmailNotification(params: {
  to: string;
  clientName: string;
  docName: string;
}) {
  if (!transporter) {
    console.log('[mail] Sem transporter configurado, pulando envio de e-mail');
    return;
  }

  const { to, clientName, docName } = params;

  const subject = 'Novo documento disponível - ATRA Contabilidade';
  const text = `Olá, ${clientName}!

A ATRA Contabilidade acabou de disponibilizar um novo documento para você:

- Arquivo: ${docName}

Acesse o Portal ATRA Contabilidade para visualizar e baixar:

https://seu-portal-aqui.com.br/login

(até colocar o domínio certo, pode usar o link local de desenvolvimento)

Abraços,
ATRA Contabilidade`;

  await transporter.sendMail({
    from: fromEmail,
    to,
    subject,
    text,
  });
}
