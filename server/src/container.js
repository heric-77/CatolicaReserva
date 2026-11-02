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
const FormatoDeDataEHora = require('./dominio/regras/reserva/FormatoDeDataEHora');
const HorarioValido = require('./dominio/regras/reserva/HorarioValido');
const HorarioDeFuncionamento = require('./dominio/regras/reserva/HorarioDeFuncionamento');
const LimiteDeDuracao = require('./dominio/regras/reserva/LimiteDeDuracao');
const SemHorarioNoPassado = require('./dominio/regras/reserva/SemHorarioNoPassado');
const AntecedenciaMaxima = require('./dominio/regras/reserva/AntecedenciaMaxima');
const SalaDeveExistir = require('./dominio/regras/reserva/SalaDeveExistir');
const SemConflitoDeHorario = require('./dominio/regras/reserva/SemConflitoDeHorario');
const ApenasDonoOuAdmin = require('./dominio/regras/alteracao/ApenasDonoOuAdmin');
const SomenteReservaAtiva = require('./dominio/regras/alteracao/SomenteReservaAtiva');

const ReservaService = require('./services/ReservaService');
const SalaService = require('./services/SalaService');
const UsuarioService = require('./services/UsuarioService');
const GestaoDeUsuariosService = require('./services/GestaoDeUsuariosService');
const AgendaService = require('./services/AgendaService');

const AuthController = require('./http/controllers/AuthController');
const SalaController = require('./http/controllers/SalaController');
const ReservaController = require('./http/controllers/ReservaController');
const UsuarioController = require('./http/controllers/UsuarioController');
const AgendaController = require('./http/controllers/AgendaController');
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
  const { abertura, fechamento, duracaoMaximaEmMinutos, antecedenciaMaximaEmDias } = config.reservas;
  const regrasDeReserva = [
    new CamposObrigatorios(),
    new FormatoDeDataEHora(),
    new HorarioValido(),
    new HorarioDeFuncionamento({ abertura, fechamento }),
    new LimiteDeDuracao({ maximoEmMinutos: duracaoMaximaEmMinutos }),
    new SemHorarioNoPassado(),
    new AntecedenciaMaxima({ maximoEmDias: antecedenciaMaximaEmDias }),
    new SalaDeveExistir({ consultaDeSala: salaRepository }),
    new SemConflitoDeHorario({ agendaDeReservas: reservaRepository }),
  ];
  const regrasDeEdicao = [new ApenasDonoOuAdmin({ acao: 'editar' }), new SomenteReservaAtiva()];
  const regrasDeCancelamento = [new ApenasDonoOuAdmin({ acao: 'cancelar' })];

  // 3. Services (casos de uso)
  const reservaService = new ReservaService({
    reservaRepository,
    regrasDeReserva,
    regrasDeEdicao,
    regrasDeCancelamento,
  });
  const salaService = new SalaService({ salaRepository });
  const usuarioService = new UsuarioService({
    usuarioRepository,
    geradorHash,
    geradorToken: servicoToken,
  });
  const gestaoDeUsuariosService = new GestaoDeUsuariosService({
    gestaoDeUsuariosRepository: usuarioRepository,
  });
  const agendaService = new AgendaService({
    agendaDoDia: reservaRepository,
    abertura,
    fechamento,
  });

  // 4. Camada HTTP
  const app = criarApp({
    authController: new AuthController({ usuarioService }),
    salaController: new SalaController({ salaService }),
    reservaController: new ReservaController({ reservaService }),
    usuarioController: new UsuarioController({ gestaoDeUsuariosService }),
    agendaController: new AgendaController({ agendaService }),
    autenticar: criarAutenticacao(servicoToken),
  });

  return { app, pool };
}

module.exports = criarContainer;
