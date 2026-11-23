import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Mensagens from '../src/components/Mensagens.jsx';
import FormularioReserva from '../src/components/FormularioReserva.jsx';

const salas = [
  { id: 1, nome: 'Lab 1', tipo: 'LABORATORIO' },
  { id: 2, nome: 'Sala 2', tipo: 'SALA_ESTUDO' },
];

describe('Mensagens', () => {
  test('mostra o erro no alerta e o aviso no status', () => {
    render(<Mensagens erro="Deu errado" aviso="Deu certo" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Deu errado');
    expect(screen.getByRole('status')).toHaveTextContent('Deu certo');
  });

  test('mantém as regiões na página mesmo sem mensagem', () => {
    render(<Mensagens />);
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});

describe('FormularioReserva', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-10T08:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  function preencher({ data = '2026-01-11', inicio = '10:00', fim = '11:00' } = {}) {
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: data } });
    fireEvent.change(screen.getByLabelText('Início'), { target: { value: inicio } });
    fireEvent.change(screen.getByLabelText('Fim'), { target: { value: fim } });
  }

  test('escolhe a primeira sala e envia os dados com o salaId numérico', async () => {
    const aoEnviar = vi.fn().mockResolvedValue();
    render(<FormularioReserva salas={salas} rotulo="Reservar" aoEnviar={aoEnviar} />);
    expect(screen.getByLabelText('Sala')).toHaveValue('1');
    expect(screen.getByLabelText('Data')).toHaveAttribute('min', '2026-01-10');

    preencher();
    fireEvent.click(screen.getByRole('button', { name: 'Reservar' }));

    await waitFor(() => expect(aoEnviar).toHaveBeenCalledWith({
      salaId: 1, data: '2026-01-11', horaInicio: '10:00', horaFim: '11:00',
    }));
  });

  test('mostra a validação local e não envia', () => {
    const aoEnviar = vi.fn();
    render(<FormularioReserva salas={salas} rotulo="Reservar" aoEnviar={aoEnviar} />);
    preencher({ inicio: '11:00', fim: '10:00' });
    fireEvent.click(screen.getByRole('button', { name: 'Reservar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('A hora de fim deve ser maior');
    expect(aoEnviar).not.toHaveBeenCalled();
  });

  test('mostra o erro devolvido pelo servidor e libera o botão', async () => {
    const aoEnviar = vi.fn().mockRejectedValue(new Error('Horário ocupado.'));
    render(<FormularioReserva salas={salas} rotulo="Reservar" aoEnviar={aoEnviar} />);
    preencher();
    fireEvent.click(screen.getByRole('button', { name: 'Reservar' }));
    expect(await screen.findByText('Horário ocupado.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reservar' })).toBeEnabled();
  });

  test('preenche os valores iniciais e mostra o botão Voltar na edição', () => {
    const aoDesistir = vi.fn();
    render(
      <FormularioReserva
        salas={salas}
        inicial={{ salaId: 2, data: '2026-01-12', horaInicio: '14:00', horaFim: '15:00' }}
        rotulo="Salvar alterações"
        aoEnviar={vi.fn()}
        aoDesistir={aoDesistir}
      />
    );
    expect(screen.getByLabelText('Sala')).toHaveValue('2');
    expect(screen.getByLabelText('Início')).toHaveValue('14:00');
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(aoDesistir).toHaveBeenCalled();
  });

  test('sem salas o botão fica desabilitado; ao chegarem, a primeira é escolhida', () => {
    const { rerender } = render(<FormularioReserva salas={[]} rotulo="Reservar" aoEnviar={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Reservar' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Voltar' })).not.toBeInTheDocument();
    rerender(<FormularioReserva salas={salas} rotulo="Reservar" aoEnviar={vi.fn()} />);
    expect(screen.getByLabelText('Sala')).toHaveValue('1');
  });

  test('com focar, leva o foco para o campo Sala; sem focar, não', () => {
    const { unmount } = render(<FormularioReserva salas={salas} rotulo="Salvar" aoEnviar={vi.fn()} focar />);
    expect(screen.getByLabelText('Sala')).toHaveFocus();
    unmount();
    render(<FormularioReserva salas={salas} rotulo="Reservar" aoEnviar={vi.fn()} />);
    expect(screen.getByLabelText('Sala')).not.toHaveFocus();
  });

  test('permite trocar a sala escolhida', () => {
    render(<FormularioReserva salas={salas} rotulo="Reservar" aoEnviar={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Sala'), { target: { value: '2' } });
    expect(screen.getByLabelText('Sala')).toHaveValue('2');
  });
});
