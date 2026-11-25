import type { AuthenticatedUser } from '../shared/auth-types';
import type {
  Tutor,
  Pet,
  Veterinario,
  Consulta,
  PrescricaoAplicacao,
  ProdutoEstoque,
  Bula
} from '../shared/types';
import type { VacinaPendente } from '../shared/notification-types';

type TutorData = Omit<Tutor, 'id'>;
type PetData = Omit<Pet, 'id'>;
type ConsultaData = Omit<Consulta, 'id'>;
type PrescricaoData = Omit<PrescricaoAplicacao, 'id'>;

type View =
  | 'dashboard'
  | 'tutors'
  | 'pets'
  | 'veterinarios'
  | 'consultas'
  | 'receitas';
type AuthMode = 'login' | 'register';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('Elemento principal da aplicação não encontrado.');
}

let currentUser: AuthenticatedUser | null = null;
let tutors: Tutor[] = [];
let pets: Pet[] = [];
let vacinasPendentes: VacinaPendente[] = [];
let tutorFilterId = 0;

let veterinarios: Veterinario[] = [];
let consultas: Consulta[] = [];
let prescricoes: PrescricaoAplicacao[] = [];
let produtos: ProdutoEstoque[] = [];
let consultaPetFilterId = 0;
let bulaResultado: Bula | null = null;
let bulaNomeBusca = '';

let activeView: View = 'dashboard';
let authMode: AuthMode = 'login';
let notice = '';

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return entities[character];
  });
}

function setNotice(message: string): void {
  notice = message;
  render();
}

function getField(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function formatError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message.replace(/^Error invoking remote method '[^']+':\s*Error:\s*/i, '');
  }
  return fallback;
}

function feedback(): string {
  if (!notice) return '';

  return `
    <div class="notice" role="status">
      ${escapeHtml(notice)}
    </div>
  `;
}

function hoje(): string {
  return new Date().toLocaleDateString('sv-SE'); 
}

function nomeDoPet(petId: number): string {
  return pets.find((pet) => pet.id === petId)?.nome ?? 'Pet não encontrado';
}

function nomeDoVeterinario(id: number): string {
  const vet = veterinarios.find((item) => item.id === id);
  return vet ? vet.nome || `CRMV ${vet.crmv}` : 'Veterinário não encontrado';
}

function labelTipo(tipo: PrescricaoAplicacao['tipo']): string {
  return tipo === 'APLICACAO' ? 'Aplicação' : 'Prescrição';
}

function renderAuth(): void {
  const registering = authMode === 'register';

  root!.innerHTML = `
    <main class="auth-page">
      <section class="auth-card">
        <div class="brand-mark">V</div>

        <h1>VetCare</h1>
        <p class="muted">
          Gestão inteligente para clínicas veterinárias
        </p>

        ${feedback()}

        <h2>
          ${registering ? 'Configuração inicial' : 'Bem-vindo de volta'}
        </h2>

        <p class="muted">
          ${
            registering
              ? 'Cadastre o primeiro administrador do sistema.'
              : 'Entre com seus dados para acessar o sistema.'
          }
        </p>

        <form id="${registering ? 'admin-form' : 'login-form'}">
          ${
            registering
              ? `
                <label for="nome">Nome completo</label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  maxlength="120"
                  autocomplete="name"
                >
              `
              : ''
          }

          <label for="email">E-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxlength="150"
            autocomplete="email"
          >

          <label for="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minlength="8"
            autocomplete="${registering ? 'new-password' : 'current-password'}"
          >

          <button class="button primary full-width" type="submit">
            ${registering ? 'Criar administrador' : 'Entrar'}
          </button>
        </form>

        <button
          class="text-button"
          type="button"
          data-action="toggle-auth"
        >
          ${
            registering
              ? 'Já possui uma conta? Fazer login'
              : 'Primeiro acesso? Configurar administrador'
          }
        </button>
      </section>
    </main>
  `;
}

function renderDashboard(): string {
  const vacinaRows = vacinasPendentes
    .map(
      (vacina) => `
      <tr>
        <td><strong>${escapeHtml(vacina.pet_nome)}</strong></td>
        <td>${escapeHtml(vacina.tutor_nome)}</td>
        <td>${escapeHtml(vacina.tutor_email ?? 'Sem e-mail')}</td>
        <td>${escapeHtml(vacina.produto_nome)}</td>
        <td>${escapeHtml(vacina.proxima_dose)}</td>
      </tr>
    `
    )
    .join('');

  return `
    <section class="page-heading">
      <div>
        <p class="eyebrow">VISÃO GERAL</p>
        <h1>Olá, ${escapeHtml(currentUser?.nome)}!</h1>
        <p class="muted">
          Bem-vindo ao painel de gestão do VetCare.
        </p>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <span class="stat-label">Tutores cadastrados</span>
        <strong>${tutors.length}</strong>
        <span class="stat-description">Registros no sistema</span>
      </article>

      <article class="stat-card">
        <span class="stat-label">Pets cadastrados</span>
        <strong>${pets.length}</strong>
        <span class="stat-description">Animais registrados</span>
      </article>

      <article class="stat-card">
        <span class="stat-label">Vacinas próximas (15 dias)</span>
        <strong>${vacinasPendentes.length}</strong>
        <span class="stat-description">
          ${escapeHtml(currentUser?.role)} — ${escapeHtml(currentUser?.email)}
        </span>
      </article>
    </section>

    <section class="content-card">
      <div class="section-heading">
        <div>
          <h2>Acesso rápido</h2>
          <p class="muted">Gerencie os principais cadastros e lembretes.</p>
        </div>
      </div>

      <div class="quick-actions">
        <button class="button primary" data-action="new-tutor">
          + Cadastrar tutor
        </button>

        <button class="button secondary" data-action="new-pet">
          + Cadastrar pet
        </button>

        <button class="button secondary" data-action="go-tutors">
          Consultar tutores
        </button>

        <button class="button secondary" data-action="go-pets">
          Consultar pets
        </button>

        <button class="button secondary" data-action="send-vaccine-reminders">
          Avisar tutores (Vacinas)
        </button>
      </div>
    </section>

    <section class="content-card" style="margin-top: 22px;">
      <div class="section-heading">
        <div>
          <h2>Alertas de reforço de vacina</h2>
          <p class="muted">Doses previstas para os próximos 15 dias</p>
        </div>
      </div>

      ${
        vacinasPendentes.length
          ? `
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Pet</th>
                    <th>Tutor</th>
                    <th>E-mail</th>
                    <th>Vacina</th>
                    <th>Próxima dose</th>
                  </tr>
                </thead>
                <tbody>${vacinaRows}</tbody>
              </table>
            </div>
          `
          : `
            <div class="empty-state">
              <h3>Nenhuma vacina pendente</h3>
              <p>Não há reforços agendados para os próximos 15 dias.</p>
            </div>
          `
      }
    </section>
  `;
}

function renderTutors(): string {
  const rows = tutors.map((tutor) => `
    <tr>
      <td>
        <strong>${escapeHtml(tutor.nome)}</strong>
      </td>
      <td>${escapeHtml(tutor.cpf)}</td>
      <td>${escapeHtml(tutor.telefone || '—')}</td>
      <td>${escapeHtml(tutor.email || '—')}</td>
      <td>${escapeHtml(tutor.cidade ? `${tutor.cidade}/${tutor.uf}` : '—')}</td>
      <td>
        <div class="table-actions">
          <button
            class="button small secondary"
            data-action="edit-tutor"
            data-id="${tutor.id}"
          >
            Editar
          </button>

          <button
            class="button small danger"
            data-action="delete-tutor"
            data-id="${tutor.id}"
          >
            Excluir
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  return `
    <section class="page-heading">
      <div>
        <p class="eyebrow">CADASTROS</p>
        <h1>Tutores</h1>
        <p class="muted">
          Gerencie os responsáveis pelos animais atendidos.
        </p>
      </div>

      <button class="button primary" data-action="new-tutor">
        + Novo tutor
      </button>
    </section>

    <section class="content-card">
      <div class="section-heading">
        <div>
          <h2>Lista de tutores</h2>
          <p class="muted">${tutors.length} registro(s)</p>
        </div>
      </div>

      ${
        tutors.length
          ? `
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Telefone</th>
                    <th>E-mail</th>
                    <th>Cidade/UF</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          `
          : `
            <div class="empty-state">
              <h3>Nenhum tutor cadastrado</h3>
              <p>Comece cadastrando o primeiro tutor.</p>
              <button class="button primary" data-action="new-tutor">
                Cadastrar tutor
              </button>
            </div>
          `
      }
    </section>
  `;
}

function renderPets(): string {
  const filteredPets =
    tutorFilterId > 0
      ? pets.filter((pet) => pet.tutorId === tutorFilterId)
      : pets;

  const tutorFilterOptions = tutors
    .map(
      (tutor) => `
      <option value="${tutor.id}" ${tutorFilterId === tutor.id ? 'selected' : ''}>
        ${escapeHtml(tutor.nome)}
      </option>
    `
    )
    .join('');

  const rows = filteredPets.map((pet) => {
    const tutor = tutors.find((item) => item.id === pet.tutorId);

    return `
      <tr>
        <td><strong>${escapeHtml(pet.nome)}</strong></td>
        <td>${escapeHtml(pet.especie)}</td>
        <td>${escapeHtml(pet.raca || '—')}</td>
        <td>${escapeHtml(tutor?.nome || 'Tutor não encontrado')}</td>
        <td>${escapeHtml(pet.idade)} ano(s) | ${escapeHtml(pet.peso)} kg</td>
        <td>
          <div class="table-actions">
            <button
              class="button small secondary"
              data-action="edit-pet"
              data-id="${pet.id}"
            >
              Editar
            </button>

            <button
              class="button small danger"
              data-action="delete-pet"
              data-id="${pet.id}"
            >
              Excluir
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <section class="page-heading">
      <div>
        <p class="eyebrow">CADASTROS</p>
        <h1>Pets</h1>
        <p class="muted">
          Gerencie os animais e seus respectivos tutores.
        </p>
      </div>

      <button
        class="button primary"
        data-action="new-pet"
        ${tutors.length === 0 ? 'disabled' : ''}
      >
        + Novo pet
      </button>
    </section>

    <section class="content-card">
      <div class="section-heading">
        <div>
          <h2>Lista de pets</h2>
          <p class="muted">${filteredPets.length} registro(s)</p>
        </div>

        <div>
          <select id="pet-tutor-filter" aria-label="Filtrar por tutor">
            <option value="0">Todos os tutores</option>
            ${tutorFilterOptions}
          </select>
        </div>
      </div>

      ${
        filteredPets.length
          ? `
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Espécie</th>
                    <th>Raça</th>
                    <th>Tutor</th>
                    <th>Idade / Peso</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          `
          : `
            <div class="empty-state">
              <h3>Nenhum pet encontrado</h3>
              <p>
                ${
                  tutors.length
                    ? 'Cadastre um animal ou altere o filtro de tutor.'
                    : 'Cadastre um tutor antes de cadastrar um pet.'
                }
              </p>
              ${
                tutors.length
                  ? `
                    <button class="button primary" data-action="new-pet">
                      Cadastrar pet
                    </button>
                  `
                  : `
                    <button class="button primary" data-action="go-tutors">
                      Ir para tutores
                    </button>
                  `
              }
            </div>
          `
      }
    </section>
  `;
}


function renderVeterinarios(): string {
  const rows = veterinarios.map((vet) => `
    <tr>
      <td><strong>${escapeHtml(vet.nome || '—')}</strong></td>
      <td>${escapeHtml(vet.crmv)}</td>
      <td>${escapeHtml(vet.especialidade || '—')}</td>
      <td>${escapeHtml(vet.telefone || '—')}</td>
      <td>
        <div class="table-actions">
          <button class="button small secondary" data-action="edit-veterinario" data-id="${vet.id}">Editar</button>
          <button class="button small danger" data-action="delete-veterinario" data-id="${vet.id}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');

  return `
    <section class="page-heading">
      <div>
        <p class="eyebrow">CLÍNICA</p>
        <h1>Corpo clínico</h1>
        <p class="muted">Veterinários cadastrados na clínica.</p>
      </div>
      <button class="button primary" data-action="new-veterinario">+ Novo veterinário</button>
    </section>

    <section class="content-card">
      <div class="section-heading">
        <div>
          <h2>Lista de veterinários</h2>
          <p class="muted">${veterinarios.length} registro(s)</p>
        </div>
      </div>

      ${
        veterinarios.length
          ? `
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CRMV</th>
                    <th>Especialidade</th>
                    <th>Telefone</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          `
          : `
            <div class="empty-state">
              <h3>Nenhum veterinário cadastrado</h3>
              <p>Cadastre o primeiro veterinário da clínica.</p>
            </div>
          `
      }
    </section>
  `;
}

function renderConsultas(): string {
  const filtradas =
    consultaPetFilterId > 0
      ? consultas.filter((consulta) => consulta.petId === consultaPetFilterId)
      : consultas;

  const petOptions = pets.map((pet) => `
    <option value="${pet.id}" ${consultaPetFilterId === pet.id ? 'selected' : ''}>
      ${escapeHtml(pet.nome)}
    </option>
  `).join('');

  const rows = filtradas.map((consulta) => {
    const qtdReceitas = prescricoes.filter(
      (item) => item.consultaId === consulta.id
    ).length;

    return `
      <tr>
        <td>${escapeHtml(consulta.data)}</td>
        <td><strong>${escapeHtml(nomeDoPet(consulta.petId))}</strong></td>
        <td>${escapeHtml(nomeDoVeterinario(consulta.veterinarioId))}</td>
        <td>${escapeHtml(consulta.diagnostico || '—')}</td>
        <td>${qtdReceitas}</td>
        <td>
          <div class="table-actions">
            <button class="button small primary" data-action="new-prescricao" data-id="${consulta.id}">Receitar</button>
            <button class="button small secondary" data-action="edit-consulta" data-id="${consulta.id}">Editar</button>
            <button class="button small danger" data-action="delete-consulta" data-id="${consulta.id}">Excluir</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const titulo =
    consultaPetFilterId > 0
      ? `Prontuário de ${escapeHtml(nomeDoPet(consultaPetFilterId))}`
      : 'Lista de consultas';

  const podeCriar = pets.length > 0 && veterinarios.length > 0;

  return `
    <section class="page-heading">
      <div>
        <p class="eyebrow">CLÍNICA</p>
        <h1>Consultas</h1>
        <p class="muted">Histórico clínico dos pets. Filtre por pet para ver o prontuário individual.</p>
      </div>
      <button class="button primary" data-action="new-consulta" ${podeCriar ? '' : 'disabled'}>
        + Nova consulta
      </button>
    </section>

    <section class="content-card">
      <div class="section-heading">
        <div>
          <h2>${titulo}</h2>
          <p class="muted">${filtradas.length} registro(s)</p>
        </div>

        <div>
          <select id="consulta-pet-filter" aria-label="Filtrar por pet">
            <option value="0">Todos os pets</option>
            ${petOptions}
          </select>
        </div>
      </div>

      ${
        filtradas.length
          ? `
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Pet</th>
                    <th>Veterinário</th>
                    <th>Diagnóstico</th>
                    <th>Receitas</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          `
          : `
            <div class="empty-state">
              <h3>Nenhuma consulta encontrada</h3>
              <p>
                ${
                  podeCriar
                    ? 'Registre uma consulta ou altere o filtro de pet.'
                    : 'Cadastre ao menos um pet e um veterinário antes de registrar consultas.'
                }
              </p>
            </div>
          `
      }
    </section>
  `;
}

function renderBulaResultado(): string {
  const bula = bulaResultado;

  if (!bula) return '';

  const secoes: Array<[string, string]> = [
    ['Indicações', bula.indicacoes],
    ['Posologia', bula.posologia],
    ['Contraindicações', bula.contraindicacoes],
    ['Avisos', bula.avisos],
    ['Reações adversas', bula.reacoesAdversas]
  ];

  const corpo = secoes
    .filter(([, texto]) => texto)
    .map(([titulo, texto]) => `<h3>${titulo}</h3><p>${escapeHtml(texto)}</p>`)
    .join('');

  return `
    <div>
      <h3>${escapeHtml(bula.nomeMarca || bula.principioAtivo)}</h3>
      <p class="muted">
        ${escapeHtml(bula.principioAtivo)} — fonte: ${escapeHtml(bula.fonte)} (texto em inglês)
      </p>
      ${corpo}
    </div>
  `;
}

function renderReceitas(): string {
  const ordenadas = [...prescricoes].sort((a, b) => b.id - a.id);

  const rows = ordenadas.map((item) => {
    const consulta = consultas.find((c) => c.id === item.consultaId);
    const produto = produtos.find((p) => p.id === item.produtoId);

    return `
      <tr>
        <td>${escapeHtml(item.dataAplicacao || '—')}</td>
        <td><strong>${escapeHtml(consulta ? nomeDoPet(consulta.petId) : '—')}</strong></td>
        <td>${escapeHtml(produto?.nome ?? 'Produto não encontrado')}</td>
        <td>${escapeHtml(labelTipo(item.tipo))}</td>
        <td>${escapeHtml(item.quantidade)}</td>
        <td>${escapeHtml(item.dataReforco ?? '—')}</td>
        <td>
          <div class="table-actions">
            <button class="button small danger" data-action="delete-prescricao" data-id="${item.id}">Excluir</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const produtoOptions = produtos.map((produto) => `
    <option value="${produto.id}">${escapeHtml(produto.nome)}</option>
  `).join('');

  const podeCriar = consultas.length > 0 && produtos.length > 0;

  return `
    <section class="page-heading">
      <div>
        <p class="eyebrow">CLÍNICA</p>
        <h1>Receitas</h1>
        <p class="muted">Prescrições e aplicações. Cada receita dá baixa no estoque; excluir estorna.</p>
      </div>
      <button class="button primary" data-action="new-prescricao" ${podeCriar ? '' : 'disabled'}>
        + Nova receita
      </button>
    </section>

    <section class="content-card">
      <div class="section-heading">
        <div>
          <h2>Receitas registradas</h2>
          <p class="muted">${prescricoes.length} registro(s)</p>
        </div>
      </div>

      ${
        prescricoes.length
          ? `
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Pet</th>
                    <th>Produto</th>
                    <th>Tipo</th>
                    <th>Qtd.</th>
                    <th>Próxima dose</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          `
          : `
            <div class="empty-state">
              <h3>Nenhuma receita registrada</h3>
              <p>
                ${
                  podeCriar
                    ? 'Crie uma receita a partir de uma consulta.'
                    : 'É preciso ter uma consulta e produtos em estoque para receitar.'
                }
              </p>
            </div>
          `
      }
    </section>

    <section class="content-card">
      <div class="section-heading">
        <div>
          <h2>Bulário (OpenFDA)</h2>
          <p class="muted">Busque pelo nome do princípio ativo em inglês (ex.: amoxicillin).</p>
        </div>
      </div>

      <form id="bula-form" class="modal-form">
        <div class="form-grid">
          <div>
            <label for="bula-nome">Medicamento *</label>
            <input id="bula-nome" name="nome" required maxlength="80" value="${escapeHtml(bulaNomeBusca)}">
          </div>

          <div>
            <label for="bula-produto">Salvar a bula no produto</label>
            <select id="bula-produto" name="produtoId">
              <option value="0">Não salvar, só consultar</option>
              ${produtoOptions}
            </select>
          </div>
        </div>

        <div class="modal-actions">
          <button type="submit" class="button primary">Buscar bula</button>
        </div>
      </form>

      ${renderBulaResultado()}
    </section>
  `;
}

function renderMain(): void {
   const content =
    activeView === 'tutors'
      ? renderTutors()
      : activeView === 'pets'
        ? renderPets()
        : activeView === 'veterinarios'
          ? renderVeterinarios()
          : activeView === 'consultas'
            ? renderConsultas()
            : activeView === 'receitas'
              ? renderReceitas()
              : renderDashboard();

  root!.innerHTML = `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-mark small-mark">V</div>
          <div>
            <strong>VetCare</strong>
            <span>Gestão veterinária</span>
          </div>
        </div>

                <nav class="navigation">
          <button
            class="nav-item ${activeView === 'dashboard' ? 'active' : ''}"
            data-action="go-dashboard"
          >
            <span>⌂</span> Visão geral
          </button>

          <button
            class="nav-item ${activeView === 'tutors' ? 'active' : ''}"
            data-action="go-tutors"
          >
            <span>♙</span> Tutores
          </button>

          <button
            class="nav-item ${activeView === 'pets' ? 'active' : ''}"
            data-action="go-pets"
          >
            <span>♡</span> Pets
          </button>

          <button
            class="nav-item ${activeView === 'veterinarios' ? 'active' : ''}"
            data-action="go-veterinarios"
          >
            <span>✚</span> Veterinários
          </button>

          <button
            class="nav-item ${activeView === 'consultas' ? 'active' : ''}"
            data-action="go-consultas"
          >
            <span>☰</span> Consultas
          </button>

          <button
            class="nav-item ${activeView === 'receitas' ? 'active' : ''}"
            data-action="go-receitas"
          >
            <span>℞</span> Receitas
          </button>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">
              ${escapeHtml(currentUser?.nome.charAt(0).toUpperCase())}
            </div>
            <div class="user-details">
              <strong>${escapeHtml(currentUser?.nome)}</strong>
              <span>${escapeHtml(currentUser?.role)}</span>
            </div>
          </div>

          <button class="logout-button" data-action="logout">
            Sair do sistema
          </button>
        </div>
      </aside>

      <main class="main-content">
        <header class="topbar">
          <span>VetCare Desktop</span>
          <span class="connection-status">● Sistema conectado</span>
        </header>

        <div class="page-content">
          ${feedback()}
          ${content}
        </div>
      </main>
    </div>

    <dialog id="form-dialog" class="form-dialog"></dialog>
  `;

    const filterSelect = document.querySelector<HTMLSelectElement>('#pet-tutor-filter');
  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      tutorFilterId = Number(filterSelect.value) || 0;
      render();
    });
  }

  const consultaFilter = document.querySelector<HTMLSelectElement>('#consulta-pet-filter');
  if (consultaFilter) {
    consultaFilter.addEventListener('change', () => {
      consultaPetFilterId = Number(consultaFilter.value) || 0;
      render();
    });
  }
}

function render(): void {
  if (currentUser) {
    renderMain();
  } else {
    renderAuth();
  }
}

async function loadClinicalData(): Promise<void> {
  const [
    loadedTutors,
    loadedPets,
    loadedVacinas,
    loadedVeterinarios,
    loadedConsultas,
    loadedProdutos
  ] = await Promise.all([
    window.vetcare.clinical.listTutors(),
    window.vetcare.clinical.listPets(),
    window.vetcare.notificacoes.buscarVacinasPendentes(),
    window.vetcare.clinical.listVeterinarios(),
    window.vetcare.clinical.listConsultas(),
    window.vetcare.clinical.listProdutos()
  ]);

  const prescricoesPorConsulta = await Promise.all(
    loadedConsultas.map((consulta) =>
      window.vetcare.clinical.listPrescricoesByConsulta(consulta.id)
    )
  );

  tutors = loadedTutors;
  pets = loadedPets;
  vacinasPendentes = loadedVacinas;
  veterinarios = loadedVeterinarios;
  consultas = loadedConsultas;
  produtos = loadedProdutos;
  prescricoes = ([] as PrescricaoAplicacao[]).concat(...prescricoesPorConsulta);
}


function openTutorDialog(id?: number): void {
  const tutor = id
    ? tutors.find((item) => item.id === id)
    : undefined;

  if (id && !tutor) {
    setNotice('Tutor não encontrado.');
    return;
  }

  const dialog = document.querySelector<HTMLDialogElement>('#form-dialog');

  if (!dialog) return;

  dialog.innerHTML = `
    <form id="tutor-form" class="modal-form">
      <div class="modal-heading">
        <div>
          <p class="eyebrow">CADASTRO</p>
          <h2>${tutor ? 'Editar tutor' : 'Novo tutor'}</h2>
        </div>

        <button
          type="button"
          class="icon-button"
          data-action="close-modal"
          aria-label="Fechar"
        >×</button>
      </div>

      <label for="tutor-nome">Nome completo *</label>
      <input
        id="tutor-nome"
        name="nome"
        required
        maxlength="120"
        value="${escapeHtml(tutor?.nome)}"
      >

      <label for="tutor-cpf">CPF *</label>
      <input
        id="tutor-cpf"
        name="cpf"
        required
        maxlength="14"
        placeholder="000.000.000-00"
        value="${escapeHtml(tutor?.cpf)}"
      >

      <div class="form-grid">
        <div>
          <label for="tutor-telefone">Telefone</label>
          <input
            id="tutor-telefone"
            name="telefone"
            maxlength="20"
            value="${escapeHtml(tutor?.telefone)}"
          >
        </div>

        <div>
          <label for="tutor-email">E-mail</label>
          <input
            id="tutor-email"
            name="email"
            type="email"
            maxlength="150"
            value="${escapeHtml(tutor?.email)}"
          >
        </div>
      </div>

      <div class="form-grid">
        <div>
          <label for="tutor-cep">CEP</label>
          <div style="display: flex; gap: 8px;">
            <input
              id="tutor-cep"
              name="cep"
              maxlength="9"
              placeholder="00000-000"
              value="${escapeHtml(tutor?.cep)}"
            >
            <button
              type="button"
              class="button secondary"
              data-action="buscar-cep"
            >
              Buscar CEP
            </button>
          </div>
        </div>

        <div>
          <label for="tutor-uf">UF</label>
          <input
            id="tutor-uf"
            name="uf"
            maxlength="2"
            value="${escapeHtml(tutor?.uf)}"
          >
        </div>
      </div>

      <label for="tutor-logradouro">Logradouro</label>
      <input
        id="tutor-logradouro"
        name="logradouro"
        maxlength="150"
        value="${escapeHtml(tutor?.logradouro)}"
      >

      <div class="form-grid">
        <div>
          <label for="tutor-bairro">Bairro</label>
          <input
            id="tutor-bairro"
            name="bairro"
            maxlength="100"
            value="${escapeHtml(tutor?.bairro)}"
          >
        </div>

        <div>
          <label for="tutor-cidade">Cidade</label>
          <input
            id="tutor-cidade"
            name="cidade"
            maxlength="100"
            value="${escapeHtml(tutor?.cidade)}"
          >
        </div>
      </div>

      <p id="modal-cep-status" class="muted" style="margin: 4px 0 0;"></p>

      <div class="modal-actions">
        <button
          type="button"
          class="button secondary"
          data-action="close-modal"
        >
          Cancelar
        </button>

        <button type="submit" class="button primary">
          ${tutor ? 'Salvar alterações' : 'Cadastrar tutor'}
        </button>
      </div>
    </form>
  `;

  dialog.dataset.editId = tutor ? String(tutor.id) : '';
  dialog.showModal();
}

async function handleBuscarCep(button: HTMLButtonElement): Promise<void> {
  const cepInput = document.querySelector<HTMLInputElement>('#tutor-cep');
  const logradouroInput = document.querySelector<HTMLInputElement>('#tutor-logradouro');
  const bairroInput = document.querySelector<HTMLInputElement>('#tutor-bairro');
  const cidadeInput = document.querySelector<HTMLInputElement>('#tutor-cidade');
  const ufInput = document.querySelector<HTMLInputElement>('#tutor-uf');
  const statusEl = document.querySelector<HTMLParagraphElement>('#modal-cep-status');

  if (!cepInput || !logradouroInput || !bairroInput || !cidadeInput || !ufInput) return;

  button.disabled = true;
  button.textContent = 'Buscando...';
  if (statusEl) statusEl.textContent = '';

  try {
    const endereco = await window.vetcare.clinical.buscarCep(cepInput.value);
    cepInput.value = endereco.cep;
    logradouroInput.value = endereco.logradouro;
    bairroInput.value = endereco.bairro;
    cidadeInput.value = endereco.cidade;
    ufInput.value = endereco.uf;
    if (statusEl) {
      statusEl.textContent = 'Endereço preenchido via ViaCEP.';
    }
  } catch (error) {
    if (statusEl) {
      statusEl.textContent = formatError(error, 'Não foi possível consultar o CEP.');
    }
  } finally {
    button.disabled = false;
    button.textContent = 'Buscar CEP';
  }
}

function openPetDialog(id?: number): void {
  const pet = id
    ? pets.find((item) => item.id === id)
    : undefined;

  if (id && !pet) {
    setNotice('Pet não encontrado.');
    return;
  }

  if (tutors.length === 0) {
    setNotice('Cadastre um tutor antes de cadastrar um pet.');
    return;
  }

  const dialog = document.querySelector<HTMLDialogElement>('#form-dialog');

  if (!dialog) return;

  const tutorOptions = tutors.map((tutor) => `
    <option
      value="${tutor.id}"
      ${pet?.tutorId === tutor.id ? 'selected' : ''}
    >
      ${escapeHtml(tutor.nome)} — ${escapeHtml(tutor.cpf)}
    </option>
  `).join('');

  dialog.innerHTML = `
    <form id="pet-form" class="modal-form">
      <div class="modal-heading">
        <div>
          <p class="eyebrow">CADASTRO</p>
          <h2>${pet ? 'Editar pet' : 'Novo pet'}</h2>
        </div>

        <button
          type="button"
          class="icon-button"
          data-action="close-modal"
          aria-label="Fechar"
        >×</button>
      </div>

      <label for="pet-tutor">Tutor responsável *</label>
      <select id="pet-tutor" name="tutorId" required>
        ${tutorOptions}
      </select>

      <label for="pet-nome">Nome do animal *</label>
      <input
        id="pet-nome"
        name="nome"
        required
        maxlength="100"
        value="${escapeHtml(pet?.nome)}"
      >

      <label for="pet-especie">Espécie *</label>
      <select id="pet-especie" name="especie" required>
        <option value="CACHORRO" ${pet?.especie === 'CACHORRO' ? 'selected' : ''}>
          Cachorro
        </option>
        <option value="GATO" ${pet?.especie === 'GATO' ? 'selected' : ''}>
          Gato
        </option>
      </select>

      <label for="pet-raca">Raça</label>
      <input
        id="pet-raca"
        name="raca"
        maxlength="100"
        value="${escapeHtml(pet?.raca)}"
      >

      <div class="form-grid">
        <div>
          <label for="pet-idade">Idade (anos)</label>
          <input
            id="pet-idade"
            name="idade"
            type="number"
            min="0"
            step="1"
            value="${pet?.idade ?? 0}"
            required
          >
        </div>

        <div>
          <label for="pet-peso">Peso (kg)</label>
          <input
            id="pet-peso"
            name="peso"
            type="number"
            min="0"
            step="0.01"
            value="${pet?.peso ?? 0}"
            required
          >
        </div>
      </div>

      <label for="pet-observacoes">Observações</label>
      <textarea
        id="pet-observacoes"
        name="observacoes"
        rows="3"
        maxlength="1000"
      >${escapeHtml(pet?.observacoes)}</textarea>

      <div class="modal-actions">
        <button
          type="button"
          class="button secondary"
          data-action="close-modal"
        >
          Cancelar
        </button>

        <button type="submit" class="button primary">
          ${pet ? 'Salvar alterações' : 'Cadastrar pet'}
        </button>
      </div>
    </form>
  `;

  dialog.dataset.editId = pet ? String(pet.id) : '';
  dialog.showModal();
}

   function openVeterinarioDialog(id?: number): void {
  const vet = id ? veterinarios.find((item) => item.id === id) : undefined;

  if (id && !vet) {
    setNotice('Veterinário não encontrado.');
    return;
  }

  const dialog = document.querySelector<HTMLDialogElement>('#form-dialog');
  if (!dialog) return;

  const camposLogin = vet
    ? ''
    : `
      <label for="vet-nome">Nome *</label>
      <input id="vet-nome" name="nome" required maxlength="100">

      <div class="form-grid">
        <div>
          <label for="vet-email">E-mail (login) *</label>
          <input id="vet-email" name="email" type="email" required maxlength="150">
        </div>
        <div>
          <label for="vet-senha">Senha *</label>
          <input id="vet-senha" name="password" type="password" required minlength="8">
        </div>
      </div>
    `;

  dialog.innerHTML = `
    <form id="veterinario-form" class="modal-form">
      <div class="modal-heading">
        <div>
          <p class="eyebrow">CADASTRO</p>
          <h2>${vet ? 'Editar veterinário' : 'Novo veterinário'}</h2>
        </div>
        <button type="button" class="icon-button" data-action="close-modal" aria-label="Fechar">×</button>
      </div>

      ${camposLogin}

      <label for="vet-crmv">CRMV *</label>
      <input id="vet-crmv" name="crmv" required maxlength="30" value="${escapeHtml(vet?.crmv)}">

      <div class="form-grid">
        <div>
          <label for="vet-especialidade">Especialidade</label>
          <input id="vet-especialidade" name="especialidade" maxlength="100" value="${escapeHtml(vet?.especialidade)}">
        </div>
        <div>
          <label for="vet-telefone">Telefone</label>
          <input id="vet-telefone" name="telefone" maxlength="20" value="${escapeHtml(vet?.telefone)}">
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="button secondary" data-action="close-modal">Cancelar</button>
        <button type="submit" class="button primary">
          ${vet ? 'Salvar alterações' : 'Cadastrar veterinário'}
        </button>
      </div>
    </form>
  `;

  dialog.dataset.editId = vet ? String(vet.id) : '';
  dialog.showModal();
}

function openConsultaDialog(id?: number): void {
  const consulta = id ? consultas.find((item) => item.id === id) : undefined;

  if (id && !consulta) {
    setNotice('Consulta não encontrada.');
    return;
  }

  const dialog = document.querySelector<HTMLDialogElement>('#form-dialog');
  if (!dialog) return;

  const petOptions = pets.map((pet) => `
    <option value="${pet.id}" ${consulta?.petId === pet.id ? 'selected' : ''}>
      ${escapeHtml(pet.nome)} — tutor: ${escapeHtml(tutors.find((t) => t.id === pet.tutorId)?.nome ?? '—')}
    </option>
  `).join('');

  const vetOptions = veterinarios.map((vet) => `
    <option value="${vet.id}" ${consulta?.veterinarioId === vet.id ? 'selected' : ''}>
      ${escapeHtml(vet.nome || 'Veterinário')} — CRMV ${escapeHtml(vet.crmv)}
    </option>
  `).join('');

  dialog.innerHTML = `
    <form id="consulta-form" class="modal-form">
      <div class="modal-heading">
        <div>
          <p class="eyebrow">CLÍNICA</p>
          <h2>${consulta ? 'Editar consulta' : 'Nova consulta'}</h2>
        </div>
        <button type="button" class="icon-button" data-action="close-modal" aria-label="Fechar">×</button>
      </div>

      <label for="consulta-pet">Pet *</label>
      <select id="consulta-pet" name="petId" required>${petOptions}</select>

      <label for="consulta-vet">Veterinário *</label>
      <select id="consulta-vet" name="veterinarioId" required>${vetOptions}</select>

      <label for="consulta-data">Data *</label>
      <input
        id="consulta-data"
        name="data"
        type="date"
        required
        value="${escapeHtml((consulta?.data ?? hoje()).slice(0, 10))}"
      >

      <label for="consulta-diagnostico">Diagnóstico</label>
      <textarea id="consulta-diagnostico" name="diagnostico" rows="4" maxlength="2000">${escapeHtml(consulta?.diagnostico)}</textarea>

      <div class="modal-actions">
        <button type="button" class="button secondary" data-action="close-modal">Cancelar</button>
        <button type="submit" class="button primary">
          ${consulta ? 'Salvar alterações' : 'Registrar consulta'}
        </button>
      </div>
    </form>
  `;

  dialog.dataset.editId = consulta ? String(consulta.id) : '';
  dialog.showModal();
}

function openPrescricaoDialog(consultaId?: number): void {
  if (consultas.length === 0 || produtos.length === 0) {
    setNotice('É preciso ter uma consulta e produtos em estoque para receitar.');
    return;
  }

  const dialog = document.querySelector<HTMLDialogElement>('#form-dialog');
  if (!dialog) return;

  const consultaOptions = consultas.map((consulta) => `
    <option value="${consulta.id}" ${consultaId === consulta.id ? 'selected' : ''}>
      ${escapeHtml(consulta.data)} — ${escapeHtml(nomeDoPet(consulta.petId))}
    </option>
  `).join('');

  const produtoOptions = produtos.map((produto) => `
    <option value="${produto.id}">
      ${escapeHtml(produto.nome)} — estoque: ${escapeHtml(produto.quantidade)}${
        produto.validade ? ` — val. ${escapeHtml(produto.validade)}` : ''
      }
    </option>
  `).join('');

  dialog.innerHTML = `
    <form id="prescricao-form" class="modal-form">
      <div class="modal-heading">
        <div>
          <p class="eyebrow">CLÍNICA</p>
          <h2>Nova receita</h2>
        </div>
        <button type="button" class="icon-button" data-action="close-modal" aria-label="Fechar">×</button>
      </div>

      <label for="presc-consulta">Consulta *</label>
      <select id="presc-consulta" name="consultaId" required>${consultaOptions}</select>

      <label for="presc-produto">Produto *</label>
      <select id="presc-produto" name="produtoId" required>${produtoOptions}</select>

      <div class="form-grid">
        <div>
          <label for="presc-tipo">Tipo *</label>
          <select id="presc-tipo" name="tipo" required>
            <option value="PRESCRICAO">Prescrição</option>
            <option value="APLICACAO">Aplicação</option>
          </select>
        </div>
        <div>
          <label for="presc-quantidade">Quantidade *</label>
          <input id="presc-quantidade" name="quantidade" type="number" min="1" step="1" value="1" required>
        </div>
      </div>

      <div class="form-grid">
        <div>
          <label for="presc-aplicacao">Data de aplicação</label>
          <input id="presc-aplicacao" name="dataAplicacao" type="date" value="${hoje()}">
        </div>
        <div>
          <label for="presc-reforco">Próxima dose (reforço)</label>
          <input id="presc-reforco" name="dataReforco" type="date">
        </div>
      </div>

      <label for="presc-descricao">Posologia / observações</label>
      <textarea id="presc-descricao" name="descricao" rows="3" maxlength="1000"></textarea>

      <div class="modal-actions">
        <button type="button" class="button secondary" data-action="close-modal">Cancelar</button>
        <button type="submit" class="button primary">Registrar receita</button>
      </div>
    </form>
  `;

  dialog.dataset.editId = '';
  dialog.showModal();
}

async function handleAuthSubmit(form: HTMLFormElement): Promise<void> {
  const formData = new FormData(form);

  if (authMode === 'register') {
    const user = await window.vetcare.auth.registerInitialAdmin({
      nome: getField(formData, 'nome'),
      email: getField(formData, 'email'),
      password: String(formData.get('password') ?? '')
    });

    currentUser = user;
  } else {
    const user = await window.vetcare.auth.login({
      email: getField(formData, 'email'),
      password: String(formData.get('password') ?? '')
    });

    currentUser = user;
  }

  await loadClinicalData();
  activeView = 'dashboard';
  notice = '';
  render();
}

async function handleTutorSubmit(form: HTMLFormElement): Promise<void> {
  const formData = new FormData(form);

  const data: TutorData = {
    nome: getField(formData, 'nome'),
    cpf: getField(formData, 'cpf'),
    telefone: getField(formData, 'telefone'),
    email: getField(formData, 'email'),
    cep: getField(formData, 'cep'),
    logradouro: getField(formData, 'logradouro'),
    bairro: getField(formData, 'bairro'),
    cidade: getField(formData, 'cidade'),
    uf: getField(formData, 'uf').toUpperCase()
  };

  const dialog = document.querySelector<HTMLDialogElement>('#form-dialog');
  const editId = Number(dialog?.dataset.editId);

  if (editId > 0) {
    await window.vetcare.clinical.updateTutor(editId, data);
    notice = 'Tutor atualizado com sucesso.';
  } else {
    await window.vetcare.clinical.createTutor(data);
    notice = 'Tutor cadastrado com sucesso.';
  }

  dialog?.close();
  await loadClinicalData();
  render();
}

async function handlePetSubmit(form: HTMLFormElement): Promise<void> {
  const formData = new FormData(form);

  const data: PetData = {
    tutorId: Number(formData.get('tutorId')),
    nome: getField(formData, 'nome'),
    especie: getField(formData, 'especie') as Pet['especie'],
    raca: getField(formData, 'raca'),
    idade: Number(formData.get('idade')),
    peso: Number(formData.get('peso')),
    observacoes: getField(formData, 'observacoes')
  };

  if (
    !Number.isInteger(data.tutorId) ||
    !Number.isInteger(data.idade) ||
    !Number.isFinite(data.peso) ||
    data.peso < 0 ||
    data.idade < 0
  ) {
    throw new Error('Confira os dados informados para o pet.');
  }

  const dialog = document.querySelector<HTMLDialogElement>('#form-dialog');
  const editId = Number(dialog?.dataset.editId);

  if (editId > 0) {
    await window.vetcare.clinical.updatePet(editId, data);
    notice = 'Pet atualizado com sucesso.';
  } else {
    await window.vetcare.clinical.createPet(data);
    notice = 'Pet cadastrado com sucesso.';
  }

  dialog?.close();
  await loadClinicalData();
  render();
}

async function handleVeterinarioSubmit(form: HTMLFormElement): Promise<void> {
  const formData = new FormData(form);
  const dialog = document.querySelector<HTMLDialogElement>('#form-dialog');
  const editId = Number(dialog?.dataset.editId);

  const crmv = getField(formData, 'crmv');
  const especialidade = getField(formData, 'especialidade');
  const telefone = getField(formData, 'telefone');

  if (editId > 0) {
    const atual = veterinarios.find((item) => item.id === editId);

    if (!atual) {
      throw new Error('Veterinário não encontrado.');
    }

    await window.vetcare.clinical.updateVeterinario(editId, {
      usuarioId: atual.usuarioId,
      crmv,
      especialidade,
      telefone
    });

    notice = 'Veterinário atualizado com sucesso.';
  } else {
    const crmvJaExiste = veterinarios.some(
      (item) => item.crmv.toLowerCase() === crmv.toLowerCase()
    );

    if (crmvJaExiste) {
      throw new Error('Este CRMV já está cadastrado.');
    }

    const usuario = await window.vetcare.auth.createUser({
      nome: getField(formData, 'nome'),
      email: getField(formData, 'email'),
      password: String(formData.get('password') ?? ''),
      role: 'VETERINARIO'
    });

    try {
      await window.vetcare.clinical.createVeterinario({
        usuarioId: usuario.id,
        crmv,
        especialidade,
        telefone
      });
    } catch (error) {
      throw new Error(
        `O login foi criado, mas o cadastro do veterinário falhou: ${formatError(error, 'erro desconhecido')}`
      );
    }

    notice = 'Veterinário cadastrado com sucesso.';
  }

  dialog?.close();
  await loadClinicalData();
  render();
}

async function handleConsultaSubmit(form: HTMLFormElement): Promise<void> {
  const formData = new FormData(form);

  const data: ConsultaData = {
    petId: Number(formData.get('petId')),
    veterinarioId: Number(formData.get('veterinarioId')),
    data: getField(formData, 'data'),
    diagnostico: getField(formData, 'diagnostico')
  };

  const dialog = document.querySelector<HTMLDialogElement>('#form-dialog');
  const editId = Number(dialog?.dataset.editId);

  if (editId > 0) {
    await window.vetcare.clinical.updateConsulta(editId, data);
    notice = 'Consulta atualizada com sucesso.';
  } else {
    await window.vetcare.clinical.createConsulta(data);
    notice = 'Consulta registrada com sucesso.';
  }

  dialog?.close();
  await loadClinicalData();
  render();
}

async function handlePrescricaoSubmit(form: HTMLFormElement): Promise<void> {
  const formData = new FormData(form);

  const data: PrescricaoData = {
    consultaId: Number(formData.get('consultaId')),
    produtoId: Number(formData.get('produtoId')),
    tipo: getField(formData, 'tipo') as PrescricaoAplicacao['tipo'],
    descricao: getField(formData, 'descricao'),
    quantidade: Number(formData.get('quantidade')),
    dataAplicacao: getField(formData, 'dataAplicacao'),
    dataReforco: getField(formData, 'dataReforco') || null
  };

  const resultado = await window.vetcare.clinical.createPrescricao(data);

  notice = resultado.estoqueBaixo
    ? 'Receita registrada. Atenção: o estoque deste produto está baixo!'
    : 'Receita registrada e estoque atualizado.';

  document.querySelector<HTMLDialogElement>('#form-dialog')?.close();
  await loadClinicalData();
  render();
}

async function handleBulaSubmit(form: HTMLFormElement): Promise<void> {
  const formData = new FormData(form);
  const nome = getField(formData, 'nome');
  const produtoId = Number(formData.get('produtoId'));

  bulaNomeBusca = nome;
  bulaResultado = null;

  if (produtoId > 0) {
    bulaResultado = await window.vetcare.clinical.salvarBulaProduto(produtoId, nome);
    notice = 'Bula encontrada e salva no produto.';
    await loadClinicalData();
  } else {
    bulaResultado = await window.vetcare.clinical.buscarBula(nome);
    notice = 'Bula encontrada.';
  }

  render();
}

async function handleClick(event: MouseEvent): Promise<void> {
  const target = event.target;

  if (!(target instanceof Element)) return;

  const button = target.closest<HTMLButtonElement>('button[data-action]');

  if (!button) return;

  const action = button.dataset.action;
  const id = Number(button.dataset.id);

  try {
    switch (action) {
      case 'toggle-auth':
        authMode = authMode === 'login' ? 'register' : 'login';
        notice = '';
        render();
        break;

      case 'go-dashboard':
        activeView = 'dashboard';
        notice = '';
        render();
        break;

      case 'go-tutors':
        activeView = 'tutors';
        notice = '';
        render();
        break;

      case 'go-pets':
        activeView = 'pets';
        notice = '';
        render();
        break;

      case 'new-tutor':
        openTutorDialog();
        break;

      case 'edit-tutor':
        openTutorDialog(id);
        break;

      case 'buscar-cep':
        await handleBuscarCep(button);
        break;

      case 'new-pet':
        openPetDialog();
        break;

      case 'edit-pet':
        openPetDialog(id);
        break;

           case 'go-veterinarios':
        activeView = 'veterinarios';
        notice = '';
        render();
        break;

      case 'go-consultas':
        activeView = 'consultas';
        notice = '';
        render();
        break;

      case 'go-receitas':
        activeView = 'receitas';
        notice = '';
        render();
        break;

      case 'new-veterinario':
        openVeterinarioDialog();
        break;

      case 'edit-veterinario':
        openVeterinarioDialog(id);
        break;

      case 'new-consulta':
        openConsultaDialog();
        break;

      case 'edit-consulta':
        openConsultaDialog(id);
        break;

      case 'new-prescricao':
        openPrescricaoDialog(id > 0 ? id : undefined);
        break;

      case 'delete-veterinario':
        if (confirm('Deseja realmente excluir este veterinário?')) {
          await window.vetcare.clinical.deleteVeterinario(id);
          await loadClinicalData();
          setNotice('Veterinário excluído com sucesso.');
        }
        break;

      case 'delete-consulta':
        if (confirm('Deseja realmente excluir esta consulta?')) {
          await window.vetcare.clinical.deleteConsulta(id);
          await loadClinicalData();
          setNotice('Consulta excluída com sucesso.');
        }
        break;

      case 'delete-prescricao':
        if (confirm('Excluir esta receita? A quantidade volta para o estoque.')) {
          await window.vetcare.clinical.deletePrescricao(id);
          await loadClinicalData();
          setNotice('Receita excluída e estoque estornado.');
        }
        break;   


      case 'close-modal':
        document.querySelector<HTMLDialogElement>('#form-dialog')?.close();
        break;

      case 'delete-tutor':
        if (confirm('Deseja realmente excluir este tutor?')) {
          await window.vetcare.clinical.deleteTutor(id);
          await loadClinicalData();
          setNotice('Tutor excluído com sucesso.');
        }
        break;

      case 'delete-pet':
        if (confirm('Deseja realmente excluir este pet?')) {
          await window.vetcare.clinical.deletePet(id);
          await loadClinicalData();
          setNotice('Pet excluído com sucesso.');
        }
        break;

      case 'send-vaccine-reminders': {
        const res = await window.vetcare.notificacoes.enviarNotificacoes();
        setNotice(
          `Notificações Brevo: ${res.enviados} enviado(s), ${res.ignorados} ignorado(s), ${res.falhas} falha(s).`
        );
        break;
      }

      case 'logout':
        await window.vetcare.auth.logout();
        currentUser = null;
        tutors = [];
        pets = [];
        vacinasPendentes = [];
        veterinarios = [];
        consultas = [];
        prescricoes = [];
        produtos = [];
        bulaResultado = null;
        bulaNomeBusca = '';
        consultaPetFilterId = 0;
        authMode = 'login';
        notice = '';
        render();
        break;
    }
  } catch (error) {
    setNotice(
      formatError(error, 'Não foi possível executar a operação.')
    );
  }
}

async function handleSubmit(event: SubmitEvent): Promise<void> {
  const target = event.target;

  if (!(target instanceof HTMLFormElement)) return;

  event.preventDefault();

  try {
    switch (target.id) {
      case 'login-form':
      case 'admin-form':
        await handleAuthSubmit(target);
        break;

      case 'tutor-form':
        await handleTutorSubmit(target);
        break;

      case 'pet-form':
        await handlePetSubmit(target);
        break;

      case 'veterinario-form':
        await handleVeterinarioSubmit(target);
        break;

      case 'consulta-form':
        await handleConsultaSubmit(target);
        break;

      case 'prescricao-form':
        await handlePrescricaoSubmit(target);
        break;

      case 'bula-form':
        await handleBulaSubmit(target);
        break;  
    }
      
  } catch (error) {
    setNotice(
      formatError(error, 'Não foi possível salvar os dados.')
    );
  }
}

root.addEventListener('click', (event) => {
  void handleClick(event);
});

root.addEventListener('submit', (event) => {
  void handleSubmit(event);
});

async function initialize(): Promise<void> {
  try {
    currentUser = await window.vetcare.auth.getCurrentUser();

    if (currentUser) {
      await loadClinicalData();
    }
  } catch {
    currentUser = null;
    notice = 'Não foi possível recuperar a sessão anterior.';
  }

  render();
}

void initialize();