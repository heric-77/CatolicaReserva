import { useState } from 'react';
import { api } from '../api.js';

export default function Login({ aoEntrar }) {
  const [modo, setModo] = useState('login'); // 'login' ou 'cadastro'
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState('ALUNO');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      if (modo === 'cadastro') {
        await api.registrar({ nome, email, senha, tipo });
      }
      const resultado = await api.login({ email, senha });
      aoEntrar(resultado);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="cartao cartao-login">
      <h2>{modo === 'login' ? 'Entrar' : 'Criar conta'}</h2>

      <form onSubmit={enviar} className="formulario">
        {modo === 'cadastro' && (
          <label>
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </label>
        )}

        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <label>
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </label>

        {modo === 'cadastro' && (
          <label>
            Tipo
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="ALUNO">Aluno</option>
              <option value="PROFESSOR">Professor</option>
            </select>
          </label>
        )}

        {erro && <p className="erro">{erro}</p>}

        <button className="btn" disabled={carregando}>
          {carregando ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Cadastrar e entrar'}
        </button>
      </form>

      <p className="troca-modo">
        {modo === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
        <button
          className="btn-link"
          onClick={() => { setModo(modo === 'login' ? 'cadastro' : 'login'); setErro(''); }}
        >
          {modo === 'login' ? 'Cadastre-se' : 'Fazer login'}
        </button>
      </p>
    </div>
  );
}
