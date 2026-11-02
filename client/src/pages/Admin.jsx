// Área do administrador: reúne as reservas, as salas e os usuários.
import { useState } from 'react';
import AdminReservas from './admin/AdminReservas.jsx';
import AdminSalas from './admin/AdminSalas.jsx';
import AdminUsuarios from './admin/AdminUsuarios.jsx';

const SECOES = [
  { id: 'reservas', rotulo: 'Reservas' },
  { id: 'salas', rotulo: 'Salas' },
  { id: 'usuarios', rotulo: 'Usuários' },
];

export default function Admin({ usuario }) {
  const [secao, setSecao] = useState('reservas');

  return (
    <>
      <nav className="sub-navegacao" aria-label="Administração">
        {SECOES.map((s) => (
          <button
            key={s.id}
            aria-current={secao === s.id ? 'page' : undefined}
            onClick={() => setSecao(s.id)}
          >
            {s.rotulo}
          </button>
        ))}
      </nav>

      {secao === 'reservas' && <AdminReservas />}
      {secao === 'salas' && <AdminSalas />}
      {secao === 'usuarios' && <AdminUsuarios usuario={usuario} />}
    </>
  );
}
