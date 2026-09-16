// UsuarioService - regras de negócio de usuário: registro e autenticação.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioRepository = require('../repositories/usuarioRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'troque-este-segredo';
const TIPOS_VALIDOS = ['ALUNO', 'PROFESSOR', 'ADMIN'];

async function registrar({ nome, email, senha, tipo }) {
  if (!nome || !email || !senha) {
    const erro = new Error('Nome, e-mail e senha são obrigatórios.');
    erro.status = 400;
    throw erro;
  }
  if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
    const erro = new Error('Tipo de usuário inválido.');
    erro.status = 400;
    throw erro;
  }

  const jaExiste = await usuarioRepository.buscarPorEmail(email);
  if (jaExiste) {
    const erro = new Error('Já existe um usuário com esse e-mail.');
    erro.status = 409;
    throw erro;
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await usuarioRepository.salvar({
    nome,
    email,
    senha: senhaHash,
    tipo: tipo || 'ALUNO',
  });
  return usuario; // sem a senha
}

async function autenticar({ email, senha }) {
  const usuario = await usuarioRepository.buscarPorEmail(email);
  if (!usuario) {
    const erro = new Error('E-mail ou senha inválidos.');
    erro.status = 401;
    throw erro;
  }

  const senhaConfere = await bcrypt.compare(senha, usuario.senha);
  if (!senhaConfere) {
    const erro = new Error('E-mail ou senha inválidos.');
    erro.status = 401;
    throw erro;
  }

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, tipo: usuario.tipo },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo },
  };
}

module.exports = { registrar, autenticar };
