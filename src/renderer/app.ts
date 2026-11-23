
import type { AuthenticatedUser } from '../shared/auth-types';
import type { Tutor, Pet } from '../shared/types';

type TutorData = Omit<Tutor, 'id'>;
type PetData = Omit<Pet, 'id'>;

type View = 'dashboard' | 'tutors' | 'pets';
type AuthMode = 'login' | 'register';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('Elemento principal da aplicação não encontrado.');
}

let currentUser: AuthenticatedUser | null = null;
let tutors: Tutor[] = [];
let pets: Pet[] = [];

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

function feedback(): string {
  if (!notice) return '';

  return `
    <div class="notice" role="status">
      ${escapeHtml(notice)}
    </div>
  `;
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
        <span class="stat-label">Usuário conectado</span>
        <strong class="role-value">
          ${escapeHtml(currentUser?.role)}
        </strong>
        <span class="stat-description">
          ${escapeHtml(currentUser?.email)}
        </span>
      </article>
    </section>

    <section class="content-card">
      <div class="section-heading">
        <div>
          <h2>Acesso rápido</h2>
          <p class="muted">Gerencie os principais cadastros.</p>
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
      </div>
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
  const rows = pets.map((pet) => {
    const tutor = tutors.find((item) => item.id === pet.tutorId);

    return `
      <tr>
        <td><strong>${escapeHtml(pet.nome)}</strong></td>
        <td>${escapeHtml(pet.especie)}</td>
        <td>${escapeHtml(pet.raca || '—')}</td>
        <td>${escapeHtml(tutor?.nome || 'Tutor não encontrado')}</td>
        <td>${escapeHtml(pet.idade)} ano(s)</td>
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
          <p class="muted">${pets.length} registro(s)</p>
        </div>
      </div>

      ${
        pets.length
          ? `
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Espécie</th>
                    <th>Raça</th>
                    <th>Tutor</th>
                    <th>Idade</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          `
          : `
            <div class="empty-state">
              <h3>Nenhum pet cadastrado</h3>
              <p>
                ${
                  tutors.length
                    ? 'Cadastre o primeiro animal.'
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

function renderMain(): void {
  const content =
    activeView === 'tutors'
      ? renderTutors()
      : activeView === 'pets'
        ? renderPets()
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
}

function render(): void {
  if (currentUser) {
    renderMain();
  } else {
    renderAuth();
  }
}

async function loadClinicalData(): Promise<void> {
  const [loadedTutors, loadedPets] = await Promise.all([
    window.vetcare.clinical.listTutors(),
    window.vetcare.clinical.listPets()
  ]);

  tutors = loadedTutors;
  pets = loadedPets;
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
          <input
            id="tutor-cep"
            name="cep"
            maxlength="9"
            placeholder="00000-000"
            value="${escapeHtml(tutor?.cep)}"
          >
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

      case 'new-pet':
        openPetDialog();
        break;

      case 'edit-pet':
        openPetDialog(id);
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

      case 'logout':
        await window.vetcare.auth.logout();
        currentUser = null;
        tutors = [];
        pets = [];
        authMode = 'login';
        notice = '';
        render();
        break;
    }
  } catch (error) {
    setNotice(
      error instanceof Error
        ? error.message
        : 'Não foi possível executar a operação.'
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
    }
  } catch (error) {
    setNotice(
      error instanceof Error
        ? error.message
        : 'Não foi possível salvar os dados.'
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
