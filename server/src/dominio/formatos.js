// Conferência de formato de datas e horas usadas pelas regras de negócio.

// Aceita apenas 'AAAA-MM-DD' de um dia que existe (rejeita, por exemplo, 2026-02-31).
function ehDataValida(texto) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(texto));
  if (!partes) return false;
  const [ano, mes, dia] = partes.slice(1).map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

// Aceita 'HH:MM' ou 'HH:MM:SS'.
function ehHoraValida(texto) {
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(String(texto));
}

module.exports = { ehDataValida, ehHoraValida };
