// Container de dependências (Composition Root).
// É o ÚNICO lugar que conhece as classes concretas e decide quem recebe o quê.
// Trocar o MySQL por outro banco, o bcrypt por outro algoritmo ou
// acrescentar uma regra de reserva nova é uma mudança feita apenas aqui.
const { criarPool } = require('./infra/mysql/conexao');
const MySqlReservaRepository = require('./infra/mysql/MySqlReservaRepository');
const MySqlSalaRepository = require('./infra/mysql/MySqlSalaRepository');
const MySqlUsuarioRepository = require('./infra/mysql/MySqlUsuarioRepository');
const BcryptGeradorHash = require('./infra/seguranca/BcryptGeradorHash');
const JwtServicoToken = require('./infra/seguranca/JwtServicoToken');

const CamposObrigatorios = require('./dominio/regras/reserva/CamposObrigatorios');
const HorarioValido = require('./dominio/regras/reserva/HorarioValido');
const SalaDeveExistir = require('./dominio/regras/reserva/SalaDeveExistir');
const SemConflitoDeHorario = require('./dominio/regras/reserva/SemConflitoDeHorario');
const ApenasDonoOuAdmin = require('./dominio/regras/cancelamento/ApenasDonoOuAdmin');

const ReservaService = require('./services/ReservaService');
const SalaService = require('./services/SalaService');
const UsuarioService = require('./services/UsuarioService');

const AuthController = require('./http/controllers/AuthController');
const SalaController = require('./http/controllers/SalaController');
const ReservaController = require('./http/controllers/ReservaController');
const { criarAutenticacao } = require('./http/middlewares/autenticacao');
const criarApp = require('./app');

function criarContainer(config) {
  // 1. Infraestrutura (detalhes técnicos)
  const pool = criarPool(config.banco);
  const reservaRepository = new MySqlReservaRepository(pool);
  const salaRepository = new MySqlSalaRepository(pool);
  const usuarioRepository = new MySqlUsuarioRepository(pool);
  const geradorHash = new BcryptGeradorHash();
  const servicoToken = new JwtServicoToken(config.jwt);

  // 2. Regras de negócio (a ordem da lista é a ordem de validação)
  const regrasDeCriacao = [
    new CamposObrigatorios(),
    new HorarioValido(),
    new SalaDeveExistir({ salaRepository }),
    new SemConflitoDeHorario({ agendaDeReservas: reservaRepository }),
  ];
  const regrasDeCancelamento = [new ApenasDonoOuAdmin()];

  // 3. Services (casos de uso)
  const reservaService = new ReservaService({ reservaRepository, regrasDeCriacao, regrasDeCancelamento });
  const salaService = new SalaService({ salaRepository });
  const usuarioService = new UsuarioService({
    usuarioRepository,
    geradorHash,
    geradorToken: servicoToken,
  });

  // 4. Camada HTTP
  const app = criarApp({
    authController: new AuthController({ usuarioService }),
    salaController: new SalaController({ salaService }),
    reservaController: new ReservaController({ reservaService }),
    autenticar: criarAutenticacao(servicoToken),
  });

  return { app, pool };
}

module.exports = criarContainer;
