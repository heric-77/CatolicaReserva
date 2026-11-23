// Etiqueta com a situação da sala agora: livre, ocupada ou fechada.
export default function SituacaoSala({ situacao }) {
  if (situacao.tipo === 'fechada') return <span className="situacao fechada">Fechada agora</span>;
  if (situacao.tipo === 'ocupada') return <span className="situacao ocupada">Ocupada até {situacao.ate}</span>;
  return <span className="situacao livre">Livre até {situacao.ate}</span>;
}
