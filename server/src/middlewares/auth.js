// Middleware de autenticação: valida o token JWT enviado no cabeçalho
// Authorization: Bearer <token> e coloca os dados do usuário em req.usuario.
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'troque-este-segredo';

function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: 'Token não informado. Faça login.' });
  }

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
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

module.exports = { autenticar, apenas };
