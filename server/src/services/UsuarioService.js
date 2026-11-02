// UsuarioService - casos de uso de registro e autenticação.
// Não conhece bcrypt nem JWT: usa os contratos GeradorHash e GeradorToken.
const Usuario = require('../dominio/entidades/Usuario');
const { ConflitoError, CredenciaisInvalidasError } = require('../dominio/erros');
const UsuarioRepository = require('../dominio/contratos/UsuarioRepository');
const GeradorHash = require('../dominio/contratos/GeradorHash');
const GeradorToken = require('../dominio/contratos/GeradorToken');

class UsuarioService {
  constructor({ usuarioRepository, geradorHash, geradorToken }) {
    this.usuarioRepository = UsuarioRepository.verificar(usuarioRepository);
    this.geradorHash = GeradorHash.verificar(geradorHash);
    this.geradorToken = GeradorToken.verificar(geradorToken);
  }

  async registrar({ nome, email, senha, tipo }) {
    Usuario.validarCadastro({ nome, email, senha, tipo });

    const jaExiste = await this.usuarioRepository.buscarPorEmail(email);
    if (jaExiste) {
      throw new ConflitoError('Já existe um usuário com esse e-mail.');
    }

    const senhaHash = await this.geradorHash.gerar(senha);
    return this.usuarioRepository.salvar(
      new Usuario({ nome, email, senhaHash, tipo: tipo || Usuario.TIPOS.ALUNO })
    );
  }

  async autenticar({ email, senha }) {
    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    const senhaConfere = usuario && (await this.geradorHash.comparar(senha, usuario.senhaHash));
    if (!senhaConfere) {
      throw new CredenciaisInvalidasError('E-mail ou senha inválidos.');
    }

    const token = this.geradorToken.gerar({ id: usuario.id, nome: usuario.nome, tipo: usuario.tipo });
    return { token, usuario };
  }
}

module.exports = UsuarioService;
