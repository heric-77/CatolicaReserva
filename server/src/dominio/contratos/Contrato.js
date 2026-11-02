// JavaScript não tem "interface" como Java/C#. Este Contrato faz esse papel:
// guarda o nome da interface e a lista de métodos que toda implementação
// precisa ter. As classes de alto nível (services, regras) chamam
// verificar() no construtor e, se faltar algum método, a aplicação
// nem sobe — o erro aparece na hora, e não no meio de uma requisição.
class Contrato {
  constructor(nome, metodos) {
    this.nome = nome;
    this.metodos = metodos;
  }

  verificar(implementacao) {
    const faltando = this.metodos.filter(
      (metodo) => typeof implementacao?.[metodo] !== 'function'
    );
    if (faltando.length > 0) {
      const classe = implementacao?.constructor?.name || String(implementacao);
      throw new TypeError(
        `${classe} não implementa o contrato ${this.nome}: faltando ${faltando.join(', ')}.`
      );
    }
    return implementacao;
  }
}

module.exports = Contrato;
