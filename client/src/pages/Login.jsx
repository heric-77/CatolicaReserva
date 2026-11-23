import { useState } from 'react';
import { CalendarDays, Clock, ShieldCheck } from 'lucide-react';
import { api } from '../api.js';
import Logo from '../components/Logo.jsx';
import Mensagens from '../components/Mensagens.jsx';
import { validarCadastro } from '../validacoes.js';

const DESTAQUES = [
  { icone: CalendarDays, texto: 'Veja os horários livres de todas as salas em uma única agenda.' },
  { icone: Clock, texto: 'Reserve em segundos, sem conflito com outras reservas.' },
  { icone: ShieldCheck, texto: 'Altere ou cancele quando precisar, direto pelo celular.' },
];

export default function Login({ aoEntrar, mensagem }) {
  const [modo, setModo] = useState('login'); // 'login' ou 'cadastro'
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState('ALUNO');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const cadastro = modo === 'cadastro';

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (cadastro) {
      const problema = validarCadastro({ nome });
      if (problema) {
        setErro(problema);
        return;
      }
    }
    setCarregando(true);
    try {
      if (cadastro) {
        await api.registrar({ nome: nome.trim(), email, senha, tipo });
      }
      const resultado = await api.login({ email, senha });
      aoEntrar(resultado);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  let rotuloDoBotao = cadastro ? 'Cadastrar e entrar' : 'Entrar';
  if (carregando) rotuloDoBotao = 'Aguarde...';

  return (
    <div className="tela-login">
      <section className="painel-marca">
        <Logo claro />
        <div className="painel-marca-texto">
          <p className="painel-marca-titulo">Reserve salas de estudo e laboratórios sem complicação.</p>
          <ul>
            {DESTAQUES.map(({ icone: Icone, texto }) => (
              <li key={texto}>
                <span className="painel-marca-icone" aria-hidden="true"><Icone size={18} /></span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
        <p className="painel-marca-rodape">Sistema de Reserva de Salas de Estudo e Laboratórios</p>
      </section>

      <section className="painel-formulario">
        <div className="caixa-login">
          <h2>{cadastro ? 'Criar conta' : 'Entrar'}</h2>
          <p className="caixa-login-descricao">
            {cadastro
              ? 'Preencha seus dados para começar a reservar.'
              : 'Use seu e-mail e senha para acessar suas reservas.'}
          </p>

          <form onSubmit={enviar} className="formulario">
            {cadastro && (
              <label>
                Nome
                <input autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </label>
            )}

            <label>
              E-mail
              <input
                type="email"
                autoComplete="email"
                placeholder="voce@catolicasc.edu.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                autoComplete={cadastro ? 'new-password' : 'current-password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </label>

            {cadastro && (
              <label>
                Tipo
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="ALUNO">Aluno</option>
                  <option value="PROFESSOR">Professor</option>
                </select>
              </label>
            )}

            <Mensagens erro={erro} aviso={mensagem} />

            <button type="submit" className="btn btn-bloco" disabled={carregando}>
              {rotuloDoBotao}
            </button>
          </form>

          <p className="troca-modo">
            {cadastro ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
            <button
              type="button"
              className="btn-link"
              onClick={() => { setModo(cadastro ? 'login' : 'cadastro'); setErro(''); }}
            >
              {cadastro ? 'Fazer login' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
