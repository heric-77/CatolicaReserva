// Diálogo de confirmação (substitui o window.confirm do navegador).
import Dialogo from './Dialogo.jsx';

export default function Confirmacao({ titulo, mensagem, acao, aoResponder }) {
  return (
    <Dialogo
      titulo={titulo}
      descricao={mensagem}
      variante="central"
      papel="alertdialog"
      aoFechar={() => aoResponder(false)}
      rodape={(
        <>
          <button type="button" className="btn-secundario" onClick={() => aoResponder(false)}>
            Voltar
          </button>
          <button type="button" className="btn btn-perigo" onClick={() => aoResponder(true)}>
            {acao}
          </button>
        </>
      )}
    />
  );
}
