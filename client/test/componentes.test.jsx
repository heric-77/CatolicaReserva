import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import Confirmacao from '../src/components/Confirmacao.jsx';
import Dialogo from '../src/components/Dialogo.jsx';
import FormularioReserva from '../src/components/FormularioReserva.jsx';
import FormularioSala from '../src/components/FormularioSala.jsx';
import IconeSala from '../src/components/IconeSala.jsx';
import ItemReserva from '../src/components/ItemReserva.jsx';
import Mensagens from '../src/components/Mensagens.jsx';
import PainelReserva from '../src/components/PainelReserva.jsx';
import SituacaoSala from '../src/components/SituacaoSala.jsx';
import Vazio from '../src/components/Vazio.jsx';
import { useAcoes } from '../src/contexto/Acoes.js';
import { AvisosProvider, useAvisos } from '../src/contexto/Avisos.jsx';
import { api } from '../src/api.js';
import { reserva } from './apiFalsa.js';

vi.mock('../src/api.js', async () => (await import('./apiFalsa.js')).criarApiFalsa());

const salas = [
  { id: 1, nome: 'Lab 1', tipo: 'LABORATORIO' },
  { id: 2, nome: 'Sala 2', tipo: 'SALA_ESTUDO' },
];
const agendaVazia = (data) => ({ data, abertura: '07:00', fechamento: '22:00', ocupadas: [] });

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

describe('IconeSala', () => {
  test.each([
    ['LABORATORIO', 'laboratorio'],
    ['SALA_ESTUDO', 'sala_estudo'],
    ['OUTRO', 'outro'],
  ])('tipo %s usa a classe %s e fica escondido dos leitores de tela', (tipo, classe) => {
    const { container } = render(<IconeSala tipo={tipo} />);
    const icone = container.querySelector('.icone-sala');
    expect(icone).toHaveClass(classe);
    expect(icone).toHaveAttribute('aria-hidden', 'true');
    expect(icone.querySelector('svg')).not.toBeNull();
  });
});

describe('SituacaoSala e Vazio', () => {
  test.each([
    [{ tipo: 'livre', ate: '14:00' }, 'Livre até 14:00'],
    [{ tipo: 'ocupada', ate: '16:00' }, 'Ocupada até 16:00'],
    [{ tipo: 'fechada' }, 'Fechada agora'],
  ])('situação %o', (situacao, texto) => {
    render(<SituacaoSala situacao={situacao} />);
    expect(screen.getByText(texto)).toBeInTheDocument();
  });

  test('Vazio mostra a mensagem e a ação', () => {
    render(<Vazio acao={<button type="button">Reservar</button>}>Nada aqui.</Vazio>);
    expect(screen.getByText('Nada aqui.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reservar' })).toBeInTheDocument();
  });
});

describe('ItemReserva', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-10T08:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  test('com o bloco de data mostra data, horário e duração, e chama as ações com a reserva', () => {
    const aoEditar = vi.fn();
    const aoCancelar = vi.fn();
    render(<ItemReserva reserva={reserva()} aoEditar={aoEditar} aoCancelar={aoCancelar} />);
    expect(screen.getByText('11/01/2026 · 10:00–11:00 · 1 h')).toBeInTheDocument();
    expect(screen.getByText('Ativa')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(aoEditar).toHaveBeenCalledWith(reserva());
    expect(aoCancelar).toHaveBeenCalledWith(reserva());
  });

  test('sem o bloco de data mostra o horário em destaque e a duração', () => {
    const { container } = render(<ItemReserva reserva={reserva({ hora_fim: '11:30:00' })} mostrarData={false} mostrarUsuario />);
    expect(container.querySelector('.hora-bloco')).toHaveTextContent('10:0011:30');
    expect(screen.getByText('1 h 30 min de duração')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });

  test('reserva que já terminou aparece como concluída e sem ações', () => {
    vi.setSystemTime(new Date('2026-01-11T11:00:00'));
    render(<ItemReserva reserva={reserva()} aoEditar={vi.fn()} aoCancelar={vi.fn()} />);
    expect(screen.getByText('Concluída')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('reserva cancelada ou sem ações não tem botões', () => {
    render(<ItemReserva reserva={reserva({ status: 'CANCELADA' })} aoEditar={vi.fn()} aoCancelar={vi.fn()} />);
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('FormularioReserva', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-10T08:00:00'));
    api.agendaDoDia.mockImplementation(async (data) => agendaVazia(data));
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

  test('preenche os valores iniciais e mostra o botão Voltar', () => {
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
    fireEvent.change(screen.getByLabelText('Sala'), { target: { value: '2' } });
    expect(screen.getByLabelText('Sala')).toHaveValue('2');
  });

  test('os atalhos de duração calculam o fim a partir do início', () => {
    render(<FormularioReserva salas={salas} rotulo="Reservar" aoEnviar={vi.fn()} />);
    expect(screen.getByRole('button', { name: '1 h' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Início'), { target: { value: '10:00' } });
    fireEvent.click(screen.getByRole('button', { name: '1 h 30 min' }));
    expect(screen.getByLabelText('Fim')).toHaveValue('11:30');
    expect(screen.getByRole('button', { name: '1 h 30 min' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '30 min' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('mostra que a sala está livre o dia todo', async () => {
    render(<FormularioReserva salas={salas} rotulo="Reservar" aoEnviar={vi.fn()} />);
    preencher();
    expect(await screen.findByText('Livre o dia todo.')).toBeInTheDocument();
    expect(api.agendaDoDia).toHaveBeenLastCalledWith('2026-01-11');
  });

  test('mostra a ocupação da sala e avisa o conflito antes de enviar', async () => {
    api.agendaDoDia.mockResolvedValue({
      ...agendaVazia('2026-01-11'),
      ocupadas: [
        { sala_id: 1, hora_inicio: '10:30:00', hora_fim: '11:30:00' },
        { sala_id: 2, hora_inicio: '08:00:00', hora_fim: '09:00:00' },
      ],
    });
    render(<FormularioReserva salas={salas} rotulo="Reservar" aoEnviar={vi.fn()} />);
    preencher({ inicio: '09:00', fim: '10:00' });
    expect(await screen.findByText('Ocupada: 10:30–11:30.')).toBeInTheDocument();
    expect(screen.queryByText(/conflita/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Fim'), { target: { value: '11:00' } });
    expect(screen.getByText('Esse horário conflita com outra reserva desta sala.')).toBeInTheDocument();
  });

  test('ao editar, a própria reserva não aparece como ocupação', async () => {
    api.agendaDoDia.mockResolvedValue({
      ...agendaVazia('2026-01-11'),
      ocupadas: [
        { sala_id: 1, hora_inicio: '10:00:00', hora_fim: '11:00:00' },
        { sala_id: 1, hora_inicio: '15:00:00', hora_fim: '16:00:00' },
      ],
    });
    render(
      <FormularioReserva
        salas={salas}
        inicial={{ salaId: 1, data: '2026-01-11', horaInicio: '10:00', horaFim: '11:00' }}
        ignorar={{ salaId: 1, data: '2026-01-11', inicio: '10:00', fim: '11:00' }}
        rotulo="Salvar"
        aoEnviar={vi.fn()}
      />
    );
    expect(await screen.findByText('Ocupada: 15:00–16:00.')).toBeInTheDocument();
    expect(screen.queryByText(/conflita/)).not.toBeInTheDocument();
  });

  test('sem data ou se a consulta falhar, não mostra a ocupação', async () => {
    api.agendaDoDia.mockRejectedValue(new Error('fora do ar'));
    render(<FormularioReserva salas={salas} rotulo="Reservar" aoEnviar={vi.fn()} />);
    preencher();
    await waitFor(() => expect(api.agendaDoDia).toHaveBeenCalled());
    expect(screen.queryByText(/Ocupação da sala/)).not.toBeInTheDocument();

    api.agendaDoDia.mockImplementation(async (data) => agendaVazia(data));
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2026-01-12' } });
    expect(await screen.findByText('Ocupação da sala neste dia')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '' } });
    expect(screen.queryByText('Ocupação da sala neste dia')).not.toBeInTheDocument();
  });

  test('ignora a resposta e o erro atrasados de uma data que já foi trocada', async () => {
    const pendentes = {};
    api.agendaDoDia.mockImplementation((data) => new Promise((resolve, reject) => {
      pendentes[data] = { resolve, reject };
    }));
    render(<FormularioReserva salas={salas} rotulo="Reservar" aoEnviar={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2026-01-11' } });
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2026-01-12' } });
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2026-01-13' } });

    await act(async () => pendentes['2026-01-11'].resolve(agendaVazia('2026-01-11')));
    await act(async () => pendentes['2026-01-12'].reject(new Error('antigo')));
    expect(screen.queryByText('Ocupação da sala neste dia')).not.toBeInTheDocument();

    await act(async () => pendentes['2026-01-13'].resolve(agendaVazia('2026-01-13')));
    expect(screen.getByText('Livre o dia todo.')).toBeInTheDocument();
  });
});

describe('Dialogo', () => {
  function ComBotao({ props = {} }) {
    const [aberto, setAberto] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setAberto(true)}>Abrir</button>
        {aberto && (
          <Dialogo titulo="Título" descricao="Descrição" aoFechar={() => setAberto(false)} {...props}>
            <input aria-label="Campo" />
            <button type="button">Último</button>
          </Dialogo>
        )}
      </>
    );
  }

  test('abre com o foco no primeiro campo e devolve o foco a quem abriu ao fechar', () => {
    render(<ComBotao />);
    const abrir = screen.getByRole('button', { name: 'Abrir' });
    abrir.focus();
    fireEvent.click(abrir);

    const dialogo = screen.getByRole('dialog', { name: 'Título' });
    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleDescription('Descrição');
    expect(screen.getByLabelText('Campo')).toHaveFocus();
    expect(document.body).toHaveClass('com-dialogo');

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
    expect(document.body).not.toHaveClass('com-dialogo');
  });

  test('fecha com Esc e com clique fora, mas não com clique dentro', () => {
    render(<ComBotao />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.mouseDown(screen.getByLabelText('Campo'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('prende o Tab dentro do diálogo nos dois sentidos', () => {
    render(<ComBotao />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    const fechar = screen.getByRole('button', { name: 'Fechar' });
    const ultimo = screen.getByRole('button', { name: 'Último' });

    ultimo.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(fechar).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(ultimo).toHaveFocus();

    // No meio da lista o Tab segue o caminho normal.
    screen.getByLabelText('Campo').focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByLabelText('Campo')).toHaveFocus();
  });

  test('sem campos o foco vai para o primeiro botão; sem descrição não há aria-describedby', () => {
    render(
      <Dialogo titulo="Só botões" aoFechar={vi.fn()} variante="central" rodape={<button type="button">OK</button>} />
    );
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByRole('button', { name: 'Fechar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK' })).toHaveFocus();
  });
});

describe('Confirmacao', () => {
  test('é um alertdialog que responde true na ação e false em Voltar ou Esc', () => {
    const aoResponder = vi.fn();
    render(<Confirmacao titulo="Cancelar reserva?" mensagem="Não dá para desfazer." acao="Cancelar reserva" aoResponder={aoResponder} />);
    expect(screen.getByRole('alertdialog', { name: 'Cancelar reserva?' })).toHaveAccessibleDescription('Não dá para desfazer.');
    expect(screen.getByRole('button', { name: 'Voltar' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar reserva' }));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(aoResponder.mock.calls).toEqual([[true], [false], [false]]);
  });
});

describe('PainelReserva', () => {
  beforeEach(() => {
    api.agendaDoDia.mockImplementation(async (data) => agendaVazia(data));
  });

  test('nova reserva: carrega as salas e envia', async () => {
    api.listarSalas.mockResolvedValue(salas);
    const aoSalvar = vi.fn().mockResolvedValue();
    render(<PainelReserva inicial={{ data: '2099-01-11', horaInicio: '10:00', horaFim: '11:00' }} aoSalvar={aoSalvar} aoFechar={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Nova reserva' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Sala')).toHaveValue('1'));
    fireEvent.click(screen.getByRole('button', { name: 'Reservar' }));
    await waitFor(() => expect(aoSalvar).toHaveBeenCalledWith({ salaId: 1, data: '2099-01-11', horaInicio: '10:00', horaFim: '11:00' }));
  });

  test('edição: título e botão próprios; mostra o erro ao carregar as salas', async () => {
    api.listarSalas.mockRejectedValue(new Error('Sem conexão.'));
    render(<PainelReserva edicao inicial={{}} aoSalvar={vi.fn()} aoFechar={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Editar reserva' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument();
    expect(await screen.findByText('Sem conexão.')).toBeInTheDocument();
  });
});

describe('FormularioSala', () => {
  function preencher(campos) {
    for (const [rotulo, valor] of Object.entries(campos)) {
      fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
    }
  }

  test('cadastra com o nome sem espaços e a capacidade numérica', async () => {
    const aoEnviar = vi.fn().mockResolvedValue();
    render(<FormularioSala aoEnviar={aoEnviar} aoDesistir={vi.fn()} />);
    preencher({ Nome: '  Sala 3 ', Tipo: 'LABORATORIO', Capacidade: '12', Recursos: 'Projetor' });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar sala' }));
    await waitFor(() => expect(aoEnviar).toHaveBeenCalledWith({ nome: 'Sala 3', tipo: 'LABORATORIO', capacidade: 12, recursos: 'Projetor' }));
  });

  test('na edição começa com os dados da sala', async () => {
    const aoEnviar = vi.fn().mockResolvedValue();
    render(<FormularioSala sala={{ id: 1, nome: 'Lab 1', tipo: 'LABORATORIO', capacidade: 30, recursos: 'PCs' }} aoEnviar={aoEnviar} aoDesistir={vi.fn()} />);
    expect(screen.getByLabelText('Capacidade')).toHaveValue(30);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(aoEnviar).toHaveBeenCalledWith({ nome: 'Lab 1', tipo: 'LABORATORIO', capacidade: 30, recursos: 'PCs' }));
  });

  test('valida antes de enviar, mostra o erro do servidor e permite voltar', async () => {
    const aoEnviar = vi.fn().mockRejectedValue(new Error('Tipo de sala inválido.'));
    const aoDesistir = vi.fn();
    render(<FormularioSala aoEnviar={aoEnviar} aoDesistir={aoDesistir} />);
    preencher({ Nome: 'Sala 3', Capacidade: '0' });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar sala' }));
    expect(screen.getByRole('alert')).toHaveTextContent('inteiro maior que zero');
    expect(aoEnviar).not.toHaveBeenCalled();

    preencher({ Capacidade: '3' });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar sala' }));
    expect(await screen.findByText('Tipo de sala inválido.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(aoDesistir).toHaveBeenCalled();
  });
});

describe('Avisos e Ações', () => {
  function Disparar() {
    const avisar = useAvisos();
    return (
      <>
        <button type="button" onClick={() => avisar('Tudo certo!')}>sucesso</button>
        <button type="button" onClick={() => avisar('Deu ruim.', 'erro')}>erro</button>
      </>
    );
  }

  test('sucessos vão para o status e erros para o alerta; o X fecha o aviso', () => {
    render(<AvisosProvider><Disparar /></AvisosProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'sucesso' }));
    fireEvent.click(screen.getByRole('button', { name: 'erro' }));
    expect(screen.getByRole('status')).toHaveTextContent('Tudo certo!');
    expect(screen.getByRole('alert')).toHaveTextContent('Deu ruim.');

    fireEvent.click(screen.getAllByRole('button', { name: 'Fechar aviso' })[0]);
    expect(screen.queryByText('Tudo certo!')).not.toBeInTheDocument();
    expect(screen.getByText('Deu ruim.')).toBeInTheDocument();
  });

  test('os avisos somem sozinhos depois de alguns segundos', () => {
    vi.useFakeTimers();
    try {
      render(<AvisosProvider><Disparar /></AvisosProvider>);
      fireEvent.click(screen.getByRole('button', { name: 'sucesso' }));
      expect(screen.getByText('Tudo certo!')).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(5000));
      expect(screen.queryByText('Tudo certo!')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  test('fora do App, useAvisos não faz nada e as ações acusam a falta do provedor', () => {
    let acoes;
    let avisar;
    function Espiar() {
      acoes = useAcoes();
      avisar = useAvisos();
      return null;
    }
    render(<Espiar />);
    expect(() => avisar('nada')).not.toThrow();
    expect(acoes.usuario).toBeNull();
    for (const nome of ['abrirReserva', 'editarReserva', 'cancelarReserva', 'confirmar', 'navegar', 'recarregar']) {
      expect(() => acoes[nome]()).toThrow(/useAcoes precisa estar dentro do App/);
    }
  });
});
