'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setError('E-mail ou senha inválidos');
      return;
    }

    const data = await res.json();
    if (data.user.role === 'ACCOUNTANT') {
      router.push('/admin/dashboard');
    } else {
      router.push('/cliente/documentos');
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        {/* logo + nome da marca */}
        <div className="brand-inline">
          <Image
            src="/logo-atra.png"
            alt="Logo ATRIA Contabilidade"
            width={32}
            height={32}
            className="brand-logo"
          />
          <span className="brand-inline-text">ATRIA CONTABILIDADE</span>
        </div>

        <h1 className="auth-title">Portal de Documentos</h1>
        <p className="auth-subtitle">
          Acesse para visualizar e enviar documentos.
        </p>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">E-mail</label>
            <input
              className="auth-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Senha</label>
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button">
            Entrar
          </button>
        </form>

        <p className="auth-footer">Desenvolvido por Gabriel para a Ester 💙</p>
      </div>
    </main>
  );
}
