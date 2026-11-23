// Ícone do tipo de sala: frasco para laboratório, livro para sala de estudo.
import { BookOpen, FlaskConical } from 'lucide-react';

const ICONES = { LABORATORIO: FlaskConical, SALA_ESTUDO: BookOpen };

export default function IconeSala({ tipo }) {
  const Icone = ICONES[tipo] || BookOpen;
  return (
    <span className={`icone-sala ${String(tipo).toLowerCase()}`} aria-hidden="true">
      <Icone size={18} />
    </span>
  );
}
