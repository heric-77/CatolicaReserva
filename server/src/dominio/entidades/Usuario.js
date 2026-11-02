// Entidade Usuario (aluno, professor ou administrador).
const { DadosInvalidosError } = require('../erros');

const TIPOS = Object.freeze({
  ALUNO: 'ALUNO',
  PROFESSOR: 'PROFESSOR',
  ADMIN: 'ADMIN',
});

class Usuario {
  constructor({ id = null, nome, email, senhaHash, tipo = TIPOS.ALUNO }) {
    this.id = id;
    this.nome = nome;
    this.email = email;
    this.senhaHash = senhaHash;
    this.tipo = tipo;
  }

  ehAdmin() {
    return this.tipo === TIPOS.ADMIN;
  }

  // Valida os dados enviados no cadastro (antes de gerar o hash da senha).
  static validarCadastro({ nome, email, senha, tipo }) {
    if (!nome || !email || !senha) {
      throw new DadosInvalidosError('Nome, e-mail e senha são obrigatórios.');
    }
    if (tipo && !Object.values(TIPOS).includes(tipo)) {
      throw new DadosInvalidosError('Tipo de usuário inválido.');
    }
  }
}

Usuario.TIPOS = TIPOS;

module.exports = Usuario;
