// AuthController - recebe as requisições de registro e login.
const usuarioService = require('../services/usuarioService');

async function registrar(req, res, next) {
  try {
    const usuario = await usuarioService.registrar(req.body);
    res.status(201).json(usuario);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const resultado = await usuarioService.autenticar(req.body);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { registrar, login };
