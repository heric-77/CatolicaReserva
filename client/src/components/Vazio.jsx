// Estado vazio de uma lista: ícone, mensagem e, se houver, uma ação (botão).
export default function Vazio({ icone: Icone, children, acao }) {
  return (
    <div className="vazio">
      {Icone && <Icone size={22} aria-hidden="true" />}
      <p>{children}</p>
      {acao}
    </div>
  );
}
