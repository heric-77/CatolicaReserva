// Mensagens de erro e de sucesso. As regiões ficam sempre na página para que os
// leitores de tela anunciem o texto assim que ele aparece.
export default function Mensagens({ erro, aviso }) {
  return (
    <div className="mensagens">
      <div role="alert">{erro && <p className="erro">{erro}</p>}</div>
      <div role="status">{aviso && <p className="aviso">{aviso}</p>}</div>
    </div>
  );
}
