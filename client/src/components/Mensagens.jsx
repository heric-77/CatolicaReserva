// Mensagens de erro e de sucesso. As regiões ficam sempre na página para que os
// leitores de tela anunciem o texto assim que ele aparece.
import { CircleAlert, CircleCheck } from 'lucide-react';

export default function Mensagens({ erro, aviso }) {
  return (
    <div className="mensagens">
      <div role="alert">
        {erro && (
          <p className="erro">
            <CircleAlert size={16} aria-hidden="true" />
            {erro}
          </p>
        )}
      </div>
      <div role="status">
        {aviso && (
          <p className="aviso">
            <CircleCheck size={16} aria-hidden="true" />
            {aviso}
          </p>
        )}
      </div>
    </div>
  );
}
