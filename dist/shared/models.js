export class UsuarioModel {
    id;
    email;
    passwordHash;
    salt;
    role;
    constructor(id, email, passwordHash, salt, role) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.salt = salt;
        this.role = role;
    }
}
export class VeterinarioModel {
    id;
    usuarioId;
    crmv;
    especialidade;
    telefone;
    constructor(id, usuarioId, crmv, especialidade, telefone) {
        this.id = id;
        this.usuarioId = usuarioId;
        this.crmv = crmv;
        this.especialidade = especialidade;
        this.telefone = telefone;
    }
}
export class TutorModel {
    id;
    nome;
    cpf;
    telefone;
    email;
    cep;
    logradouro;
    bairro;
    cidade;
    uf;
    constructor(id, nome, cpf, telefone, email, cep, logradouro, bairro, cidade, uf) {
        this.id = id;
        this.nome = nome;
        this.cpf = cpf;
        this.telefone = telefone;
        this.email = email;
        this.cep = cep;
        this.logradouro = logradouro;
        this.bairro = bairro;
        this.cidade = cidade;
        this.uf = uf;
    }
}
export class PetModel {
    id;
    tutorId;
    nome;
    especie;
    raca;
    idade;
    peso;
    observacoes;
    constructor(id, tutorId, nome, especie, raca, idade, peso, observacoes) {
        this.id = id;
        this.tutorId = tutorId;
        this.nome = nome;
        this.especie = especie;
        this.raca = raca;
        this.idade = idade;
        this.peso = peso;
        this.observacoes = observacoes;
    }
}
export class FornecedorModel {
    id;
    nome;
    documento;
    email;
    telefone;
    pais;
    moeda;
    constructor(id, nome, documento, email, telefone, pais, moeda) {
        this.id = id;
        this.nome = nome;
        this.documento = documento;
        this.email = email;
        this.telefone = telefone;
        this.pais = pais;
        this.moeda = moeda;
    }
}
export class ProdutoEstoqueModel {
    id;
    fornecedorId;
    nome;
    categoria;
    lote;
    validade;
    quantidade;
    estoqueMinimo;
    bula;
    custo;
    constructor(id, fornecedorId, nome, categoria, lote, validade, quantidade, estoqueMinimo, bula, custo) {
        this.id = id;
        this.fornecedorId = fornecedorId;
        this.nome = nome;
        this.categoria = categoria;
        this.lote = lote;
        this.validade = validade;
        this.quantidade = quantidade;
        this.estoqueMinimo = estoqueMinimo;
        this.bula = bula;
        this.custo = custo;
    }
}
export class ConsultaModel {
    id;
    petId;
    veterinarioId;
    data;
    diagnostico;
    constructor(id, petId, veterinarioId, data, diagnostico) {
        this.id = id;
        this.petId = petId;
        this.veterinarioId = veterinarioId;
        this.data = data;
        this.diagnostico = diagnostico;
    }
}
export class PrescricaoAplicacaoModel {
    id;
    consultaId;
    produtoId;
    dataAplicacao;
    dataReforco;
    constructor(id, consultaId, produtoId, dataAplicacao, dataReforco) {
        this.id = id;
        this.consultaId = consultaId;
        this.produtoId = produtoId;
        this.dataAplicacao = dataAplicacao;
        this.dataReforco = dataReforco;
    }
}
