// Rótulos e formatação de datas e horas usados nas telas.
export const TIPO_SALA = { SALA_ESTUDO: 'Sala de estudo', LABORATORIO: 'Laboratório' };
export const TIPO_USUARIO = { ALUNO: 'Aluno', PROFESSOR: 'Professor', ADMIN: 'Administrador' };

function doisDigitos(numero) {
  return String(numero).padStart(2, '0');
}

// Data de hoje no fuso do navegador, no formato 'AAAA-MM-DD'.
export function hojeISO() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${doisDigitos(hoje.getMonth() + 1)}-${doisDigitos(hoje.getDate())}`;
}

export function somarDias(iso, dias) {
  const data = new Date(`${iso}T12:00:00`);
  data.setDate(data.getDate() + dias);
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

// 'AAAA-MM-DD' -> 'DD/MM/AAAA'
export function formatarData(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

// 'AAAA-MM-DD' -> 'terça-feira, 3 de novembro'
export function formatarDataPorExtenso(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// 'HH:MM:SS' -> 'HH:MM'
export function formatarHora(hora) {
  return hora ? hora.slice(0, 5) : '';
}

export function formatarHoraCheia(hora) {
  return `${doisDigitos(hora)}:00`;
}
