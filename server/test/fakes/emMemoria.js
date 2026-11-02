// Implementações "falsas" (em memória) dos contratos, usadas nos testes.
// Elas cumprem os mesmos contratos que as classes MySQL, então podem
// substituí-las sem que os services percebam (Liskov + Inversão de Dependência).
const Reserva = require('../../src/dominio/entidades/Reserva');
const Sala = require('../../src/dominio/entidades/Sala');
const Usuario = require('../../src/dominio/entidades/Usuario');

class ReservaRepositoryEmMemoria {
  constructor(reservas = []) {
    this.reservas = reservas.map((r) => new Reserva(r));
    this.proximoId = this.reservas.length + 1;
  }

  async salvar(reserva) {
    const salva = new Reserva({ ...reserva, id: this.proximoId++ });
    this.reservas.push(salva);
    return salva;
  }

  async buscarPorId(id) {
    return this.reservas.find((r) => r.id === id) || null;
  }

  async buscarAtivasPorSalaEData(salaId, data) {
    return this.reservas.filter(
      (r) => r.salaId === salaId && r.data === data && r.status === Reserva.STATUS.ATIVA
    );
  }

  async listarPorUsuario(usuarioId) {
    return this.reservas.filter((r) => r.usuarioId === usuarioId);
  }

  async listarTodas() {
    return [...this.reservas];
  }

  async atualizarStatus(id, status) {
    const reserva = await this.buscarPorId(id);
    reserva.status = status;
    return reserva;
  }
}

class SalaRepositoryEmMemoria {
  constructor(salas = []) {
    this.salas = salas.map((s) => new Sala(s));
  }

  async listar() {
    return [...this.salas];
  }

  async buscarPorId(id) {
    return this.salas.find((s) => s.id === id) || null;
  }

  async salvar(sala) {
    const salva = new Sala({ ...sala, id: this.salas.length + 1 });
    this.salas.push(salva);
    return salva;
  }
}

class UsuarioRepositoryEmMemoria {
  constructor() {
    this.usuarios = [];
  }

  async buscarPorEmail(email) {
    return this.usuarios.find((u) => u.email === email) || null;
  }

  async salvar(usuario) {
    const salvo = new Usuario({ ...usuario, id: this.usuarios.length + 1 });
    this.usuarios.push(salvo);
    return salvo;
  }
}

// Hash e token de mentira: rápidos e previsíveis para os testes.
class GeradorHashFalso {
  async gerar(senha) {
    return `hash(${senha})`;
  }

  async comparar(senha, hash) {
    return hash === `hash(${senha})`;
  }
}

class GeradorTokenFalso {
  gerar(dados) {
    return `token-${dados.id}`;
  }
}

module.exports = {
  ReservaRepositoryEmMemoria,
  SalaRepositoryEmMemoria,
  UsuarioRepositoryEmMemoria,
  GeradorHashFalso,
  GeradorTokenFalso,
};
