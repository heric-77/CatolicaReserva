// Middlewares de autenticação e autorização.
const VerificadorToken = require('../../dominio/contratos/VerificadorToken');

// Cria o middleware que valida o token enviado no cabeçalho
// Authorization: Bearer <token> e coloca os dados do usuário em req.usuario.
// Recebe o VerificadorToken por injeção: não sabe que por trás existe JWT.
function criarAutenticacao(verificadorToken) {
  VerificadorToken.verificar(verificadorToken);

  return function autenticar(req, res, next) {
    const cabecalho = req.headers.authorization || '';
    const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;

    if (!token) {
      return res.status(401).json({ erro: 'Token não informado. Faça login.' });
    }

    try {
      req.usuario = verificadorToken.verificar(token);
      next();
    } catch (err) {
      return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }
  };
}

// Restringe a rota a determinados tipos de usuário (ex: apenas ADMIN).
function apenas(...tipos) {
  return (req, res, next) => {
    if (!req.usuario || !tipos.includes(req.usuario.tipo)) {
      return res.status(403).json({ erro: 'Acesso restrito.' });
    }
    next();
  };
}

module.exports = { criarAutenticacao, apenas };
