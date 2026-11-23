// Área do administrador: reúne as reservas, as salas e os usuários.
import { useState } from 'react';
import { CalendarDays, DoorOpen, Users } from 'lucide-react';
import CabecalhoPagina from '../components/CabecalhoPagina.jsx';
import AdminReservas from './admin/AdminReservas.jsx';
import AdminSalas from './admin/AdminSalas.jsx';
import AdminUsuarios from './admin/AdminUsuarios.jsx';

const SECOES = [
  { id: 'reservas', rotulo: 'Reservas', icone: CalendarDays, Secao: AdminReservas },
  { id: 'salas', rotulo: 'Salas', icone: DoorOpen, Secao: AdminSalas },
  { id: 'usuarios', rotulo: 'Usuários', icone: Users, Secao: AdminUsuarios },
];

export default function Admin() {
  const [secao, setSecao] = useState('reservas');
  const { Secao } = SECOES.find((s) => s.id === secao);

  return (
    <>
      <CabecalhoPagina titulo="Administração" descricao="Gerencie as reservas, as salas e os usuários do sistema." />

      <nav className="segmentado sub-navegacao" aria-label="Administração">
        {SECOES.map(({ id, rotulo, icone: Icone }) => (
          <button
            key={id}
            type="button"
            aria-current={secao === id ? 'page' : undefined}
            onClick={() => setSecao(id)}
          >
            <Icone size={16} aria-hidden="true" />
            {rotulo}
          </button>
        ))}
      </nav>

      <Secao />
    </>
  );
}
