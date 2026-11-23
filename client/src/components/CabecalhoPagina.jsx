// Título, descrição e ações (botões) no topo de cada tela.
export default function CabecalhoPagina({ titulo, descricao, children }) {
  return (
    <header className="cabecalho-pagina">
      <div>
        <h1>{titulo}</h1>
        {descricao && <p>{descricao}</p>}
      </div>
      {children && <div className="cabecalho-pagina-acoes">{children}</div>}
    </header>
  );
}
