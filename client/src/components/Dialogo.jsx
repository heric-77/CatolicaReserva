// Base dos diálogos (painel lateral e confirmação).
// Cuida da acessibilidade: leva o foco para dentro, prende o Tab no diálogo,
// fecha com Esc ou clicando fora e devolve o foco a quem abriu.
import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

const FOCAVEIS = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function Dialogo({ titulo, descricao, aoFechar, variante = 'lateral', papel = 'dialog', rodape, children }) {
  const ref = useRef(null);
  const idTitulo = useId();
  const idDescricao = useId();
  // Guarda a versão mais recente de aoFechar sem reabrir o efeito a cada renderização.
  const fechar = useRef(aoFechar);
  fechar.current = aoFechar;

  useEffect(() => {
    const anterior = document.activeElement;
    const caixa = ref.current;
    const focaveis = () => [...caixa.querySelectorAll(FOCAVEIS)].filter((el) => !el.disabled);

    // Começa pelo primeiro campo do formulário; sem campos, pelo primeiro botão
    // (numa confirmação, a opção segura: "Voltar").
    const primeiroCampo = caixa.querySelector('input, select, textarea');
    (primeiroCampo ?? focaveis()[0])?.focus();
    document.body.classList.add('com-dialogo');

    function aoTeclar(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        fechar.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const lista = focaveis();
      const primeiro = lista[0];
      const ultimo = lista.at(-1);
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }
    function aoClicarFora(e) {
      if (!caixa.contains(e.target)) fechar.current();
    }

    document.addEventListener('keydown', aoTeclar);
    document.addEventListener('mousedown', aoClicarFora);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('mousedown', aoClicarFora);
      document.body.classList.remove('com-dialogo');
      anterior?.focus?.();
    };
  }, []);

  return (
    <div className={`dialogo-fundo dialogo-${variante}`}>
      <div
        ref={ref}
        className="dialogo"
        role={papel}
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={descricao ? idDescricao : undefined}
      >
        <header className="dialogo-cabecalho">
          <div>
            <h2 id={idTitulo}>{titulo}</h2>
            {descricao && <p id={idDescricao}>{descricao}</p>}
          </div>
          {variante === 'lateral' && (
            <button type="button" className="btn-icone" aria-label="Fechar" onClick={aoFechar}>
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </header>
        <div className="dialogo-corpo">{children}</div>
        {rodape && <footer className="dialogo-rodape">{rodape}</footer>}
      </div>
    </div>
  );
}
