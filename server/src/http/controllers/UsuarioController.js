// UsuarioController - recebe as requisições de administração dos usuários.
const { apresentarUsuario } = require('../apresentadores/apresentadores');

class UsuarioController {
  constructor({ gestaoDeUsuariosService }) {
    this.gestaoDeUsuariosService = gestaoDeUsuariosService;
  }

  listar = async (req, res) => {
    const usuarios = await this.gestaoDeUsuariosService.listar();
    res.json(usuarios.map(apresentarUsuario));
  };

  alterarTipo = async (req, res) => {
    const usuario = await this.gestaoDeUsuariosService.alterarTipo(
      Number(req.params.id),
      req.body.tipo,
      req.usuario
    );
    res.json(apresentarUsuario(usuario));
  };

  remover = async (req, res) => {
    await this.gestaoDeUsuariosService.remover(Number(req.params.id), req.usuario);
    res.status(204).end();
  };
}

module.exports = UsuarioController;
