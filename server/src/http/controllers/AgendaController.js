// AgendaController - recebe a consulta de disponibilidade das salas em uma data.
const { apresentarAgenda } = require('../apresentadores/apresentadores');

class AgendaController {
  constructor({ agendaService }) {
    this.agendaService = agendaService;
  }

  doDia = async (req, res) => {
    const agenda = await this.agendaService.doDia(req.query.data);
    res.json(apresentarAgenda(agenda));
  };
}

module.exports = AgendaController;
