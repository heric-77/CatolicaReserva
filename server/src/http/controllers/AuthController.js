// AuthController - recebe as requisições de registro e login.
const { apresentarUsuario } = require('../apresentadores/apresentadores');

class AuthController {
  constructor({ usuarioService }) {
    this.usuarioService = usuarioService;
  }

  registrar = async (req, res) => {
    const usuario = await this.usuarioService.registrar(req.body);
    res.status(201).json(apresentarUsuario(usuario));
  };

  login = async (req, res) => {
    const { token, usuario } = await this.usuarioService.autenticar(req.body);
    res.json({ token, usuario: apresentarUsuario(usuario) });
  };
}

module.exports = AuthController;
