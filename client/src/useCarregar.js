// Carrega dados da API quando a tela abre e sempre que as dependências mudam.
// Ignora respostas atrasadas (de uma consulta que já foi substituída por outra).
import { useEffect, useState } from 'react';

export function useCarregar(carregar, dependencias) {
  const [estado, setEstado] = useState({ dados: null, erro: '' });

  useEffect(() => {
    let atual = true;
    carregar()
      .then((dados) => { if (atual) setEstado({ dados, erro: '' }); })
      .catch((err) => { if (atual) setEstado((anterior) => ({ ...anterior, erro: err.message })); });
    return () => { atual = false; };
  }, dependencias); // eslint-disable-line react-hooks/exhaustive-deps

  return estado;
}
