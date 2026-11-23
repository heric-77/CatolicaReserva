// Marca do sistema: ícone + nome.
import { CalendarCheck } from 'lucide-react';

export default function Logo({ claro = false }) {
  return (
    <div className={`logo${claro ? ' logo-claro' : ''}`}>
      <span className="logo-icone" aria-hidden="true">
        <CalendarCheck size={20} strokeWidth={2.25} />
      </span>
      <span className="logo-nome">
        Católica<span>Reserva</span>
      </span>
    </div>
  );
}
