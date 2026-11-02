// SalaController - recebe as requisições de cadastro e consulta de salas.
const { apresentarSala } = require('../apresentadores/apresentadores');

class SalaController {
  constructor({ salaService }) {
    this.salaService = salaService;
  }

  listar = async (req, res) => {
    const salas = await this.salaService.listar();
    res.json(salas.map(apresentarSala));
  };

  criar = async (req, res) => {
    const sala = await this.salaService.criar(req.body);
    res.status(201).json(apresentarSala(sala));
  };

  atualizar = async (req, res) => {
    const sala = await this.salaService.atualizar(Number(req.params.id), req.body);
    res.json(apresentarSala(sala));
  };

  remover = async (req, res) => {
    await this.salaService.remover(Number(req.params.id));
    res.status(204).end();
  };
}

module.exports = SalaController;
