const root = document.querySelector('#app');
if (!root) {
    throw new Error('Elemento principal da aplicação não encontrado.');
}
let currentUser = null;
let tutors = [];
let pets = [];
let suppliers = [];
let products = [];
let criticalProducts = [];
let vacinasPendentes = [];
let usdRateInfo = null;
let tutorFilterId = 0;
let activeView = 'dashboard';
let authMode = 'login';
let notice = '';
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, String.fromCharCode(38, 35, 51, 57, 59));
}
function formatCurrencyBrl(value) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}
function setNotice(message) {
    notice = message;
    render();
}
function getField(formData, name) {
    return String(formData.get(name) ?? '').trim();
}
function formatError(error, fallback) {
    if (error instanceof Error) {
        return error.message.replace(/^Error invoking remote method '[^']+':\s*Error:\s*/i, '');
    }
    return fallback;
}
function feedback() {
    if (!notice)
        return '';
    return `
    <div class="notice" role="status">
      ${escapeHtml(notice)}
    </div>
  `;
}
function renderAuth() {
    const registering = authMode === 'register';
    root.innerHTML = `
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
          ${registering
        ? 'Cadastre o primeiro administrador do sistema.'
        : 'Entre com seus dados para acessar o sistema.'}
        </p>

        <form id="${registering ? 'admin-form' : 'login-form'}">
          ${registering
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
        : ''}

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
          ${registering
        ? 'Já possui uma conta? Fazer login'
        : 'Primeiro acesso? Configurar administrador'}
        </button>
      </section>
    </main>
  `;
}
function renderPets() {
    const filteredPets = tutorFilterId > 0
        ? pets.filter((pet) => pet.tutorId === tutorFilterId)
        : pets;
    const tutorFilterOptions = tutors
        .map((tutor) => `
      <option value="${tutor.id}" ${tutorFilterId === tutor.id ? 'selected' : ''}>
        ${escapeHtml(tutor.nome)}
      </option>
    `)
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

      ${filteredPets.length
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
                ${tutors.length
            ? 'Cadastre um animal ou altere o filtro de tutor.'
            : 'Cadastre um tutor antes de cadastrar um pet.'}
              </p>
              ${tutors.length
            ? `
                    <button class="button primary" data-action="new-pet">
                      Cadastrar pet
                    </button>
                  `
            : `
                    <button class="button primary" data-action="go-tutors">
                      Ir para tutores
                    </button>
                  `}
            </div>
          `}
    </section>
  `;
}
function renderSuppliers() {
    const isAdmin = currentUser?.role === 'ADMIN';
    const rows = suppliers
        .map((supplier) => `
      <tr>
        <td><strong>${escapeHtml(supplier.nome)}</strong></td>
        <td>${escapeHtml(supplier.documento || '—')}</td>
        <td>${escapeHtml(supplier.pais)}</td>
        <td>
          <strong>${escapeHtml(supplier.moeda)}</strong>
          ${supplier.moeda === 'USD' ? ' (Importado)' : ' (Nacional)'}
        </td>
        <td>${escapeHtml(supplier.email || supplier.telefone || '—')}</td>
        <td>
          ${isAdmin
        ? `
                <div class="table-actions">
                  <button
                    class="button small secondary"
                    data-action="edit-supplier"
                    data-id="${supplier.id}"
                  >
                    Editar
                  </button>
                  <button
                    class="button small danger"
                    data-action="delete-supplier"
                    data-id="${supplier.id}"
                  >
                    Excluir
                  </button>
                </div>
              `
        : '<span class="muted">Somente leitura</span>'}
        </td>
      </tr>
    `)
        .join('');
    return `
    <section class="page-heading">
      <div>
        <p class="eyebrow">SUPRIMENTOS</p>
        <h1>Fornecedores</h1>
        <p class="muted">
          Cadastro de fornecedores nacionais (BRL) e internacionais (USD).
        </p>
      </div>

      ${isAdmin
        ? `
            <button class="button primary" data-action="new-supplier">
              + Novo fornecedor
            </button>
          `
        : ''}
    </section>

    <section class="content-card">
      <div class="section-heading">
        <div>
          <h2>Lista de fornecedores</h2>
          <p class="muted">${suppliers.length} registro(s)</p>
        </div>
      </div>

      ${suppliers.length
        ? `
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Fornecedor</th>
                    <th>CNPJ / Tax ID</th>
                    <th>País</th>
                    <th>Moeda</th>
                    <th>Contato</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          `
        : `
            <div class="empty-state">
              <h3>Nenhum fornecedor cadastrado</h3>
              <p>Cadastre fornecedores nacionais ou importados antes de registrar insumos.</p>
              ${isAdmin
            ? `
                    <button class="button primary" data-action="new-supplier">
                      Cadastrar fornecedor
                    </button>
                  `
            : ''}
            </div>
          `}
    </section>
  `;
}
function renderStock() {
    const isAdmin = currentUser?.role === 'ADMIN';
    const rows = products
        .map((item) => {
        const supplier = suppliers.find((s) => s.id === item.fornecedorId);
        const isLow = item.quantidade <= item.estoqueMinimo;
        return `
        <tr>
          <td>
            <strong>${escapeHtml(item.nome)}</strong>
            ${isLow
            ? '<div style="color: #b91c1c; font-size: 12px; font-weight: 600;">⚠ Estoque crítico</div>'
            : ''}
          </td>
          <td>${escapeHtml(item.categoria)}</td>
          <td>
            ${escapeHtml(supplier?.nome || '—')}
            ${supplier ? `<small class="muted"> (${escapeHtml(supplier.moeda)})</small>` : ''}
          </td>
          <td>${escapeHtml(item.lote || '—')} / ${escapeHtml(item.validade || '—')}</td>
          <td>
            <strong style="${isLow ? 'color: #b91c1c;' : ''}">
              ${escapeHtml(item.quantidade)}
            </strong> / mín. ${escapeHtml(item.estoqueMinimo)}
          </td>
          <td><strong>${escapeHtml(formatCurrencyBrl(item.custo))}</strong></td>
          <td>
            <div class="table-actions">
              <button
                class="button small secondary"
                data-action="edit-product"
                data-id="${item.id}"
              >
                Editar
              </button>
              ${isAdmin
            ? `
                    <button
                      class="button small danger"
                      data-action="delete-product"
                      data-id="${item.id}"
                    >
                      Excluir
                    </button>
                  `
            : ''}
            </div>
          </td>
        </tr>
      `;
    })
        .join('');
    return `
    <section class="page-heading">
      <div>
        <p class="eyebrow">SUPRIMENTOS & CÂMBIO</p>
        <h1>Estoque de Vacinas e Medicamentos</h1>
        <p class="muted">
          Produtos de fornecedores em USD são convertidos automaticamente para BRL via AwesomeAPI.
        </p>
      </div>

      <div style="display: flex; gap: 10px; align-items: center;">
        <button class="button secondary" data-action="refresh-usd">
          ${usdRateInfo
        ? `Dólar: ${formatCurrencyBrl(usdRateInfo.valorCompra)}`
        : 'Consultar Dólar (USD)'}
        </button>

        <button
          class="button primary"
          data-action="new-product"
          ${suppliers.length === 0 ? 'disabled' : ''}
        >
          + Novo item no estoque
        </button>
      </div>
    </section>

    <section class="content-card">
      <div class="section-heading">
        <div>
          <h2>Itens em estoque</h2>
          <p class="muted">
            ${products.length} item(ns) | ${criticalProducts.length} em nível crítico
          </p>
        </div>
      </div>

      ${products.length
        ? `
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Produto / Vacina</th>
                    <th>Categoria</th>
                    <th>Fornecedor</th>
                    <th>Lote / Validade</th>
                    <th>Qtd. / Mín.</th>
                    <th>Custo (BRL)</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          `
        : `
            <div class="empty-state">
              <h3>Nenhum produto no estoque</h3>
              <p>
                ${suppliers.length
            ? 'Cadastre vacinas (ex.: V10) e medicamentos no estoque.'
            : 'Cadastre um fornecedor primeiro para vincular os produtos.'}
              </p>
              ${suppliers.length
            ? `
                    <button class="button primary" data-action="new-product">
                      Cadastrar produto
                    </button>
                  `
            : `
                    <button class="button primary" data-action="go-suppliers">
                      Ir para fornecedores
                    </button>
                  `}
            </div>
          `}
    </section>
  `;
}
function renderMain() {
    const isAdmin = currentUser?.role === 'ADMIN';
    function renderDashboard() {
        const isAdmin = currentUser?.role === 'ADMIN';
        const vacinaRows = vacinasPendentes
            .map((vacina) => `
      <tr>
        <td><strong>${escapeHtml(vacina.pet_nome)}</strong></td>
        <td>${escapeHtml(vacina.tutor_nome)}</td>
        <td>${escapeHtml(vacina.tutor_email ?? 'Sem e-mail')}</td>
        <td>${escapeHtml(vacina.produto_nome)}</td>
        <td>${escapeHtml(vacina.proxima_dose)}</td>
      </tr>
    `)
            .join('');
        const criticalRows = criticalProducts
            .map((item) => {
            const supplier = suppliers.find((s) => s.id === item.fornecedorId);
            return `
        <tr>
          <td><strong>${escapeHtml(item.nome)}</strong></td>
          <td>${escapeHtml(item.categoria)}</td>
          <td>${escapeHtml(item.lote || '—')}</td>
          <td><strong style="color: #b91c1c;">${escapeHtml(item.quantidade)} un.</strong></td>
          <td>${escapeHtml(item.estoqueMinimo)} un.</td>
          <td>${escapeHtml(supplier?.nome || '—')}</td>
        </tr>
      `;
        })
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
        <span class="stat-label">Tutores / Pets</span>
        <strong>${tutors.length} / ${pets.length}</strong>
        <span class="stat-description">Clientes e animais registrados</span>
      </article>

      <article class="stat-card">
        <span class="stat-label">Estoque crítico</span>
        <strong style="${criticalProducts.length > 0 ? 'color: #b91c1c;' : ''}">
          ${criticalProducts.length}
        </strong>
        <span class="stat-description">Itens no mínimo ou abaixo</span>
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
          <p class="muted">Gerencie cadastros, estoque e lembretes.</p>
        </div>
      </div>

      <div class="quick-actions">
        <button class="button primary" data-action="new-tutor">
          + Cadastrar tutor
        </button>

        <button class="button secondary" data-action="new-pet">
          + Cadastrar pet
        </button>

        <button class="button secondary" data-action="go-stock">
          Ver estoque (${products.length})
        </button>

        ${isAdmin
            ? `
              <button class="button secondary" data-action="go-suppliers">
                Fornecedores (${suppliers.length})
              </button>
            `
            : ''}

        <button class="button secondary" data-action="send-vaccine-reminders">
          Avisar tutores (Vacinas)
        </button>
      </div>
    </section>

    <section class="content-card" style="margin-top: 22px;">
      <div class="section-heading">
        <div>
          <h2>Alertas de estoque crítico</h2>
          <p class="muted">Vacinas e medicamentos com quantidade igual ou inferior ao mínimo</p>
        </div>
        <button class="button small secondary" data-action="go-stock">
          Gerenciar estoque
        </button>
      </div>

      ${criticalProducts.length
            ? `
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Produto / Vacina</th>
                    <th>Categoria</th>
                    <th>Lote</th>
                    <th>Atual</th>
                    <th>Mínimo</th>
                    <th>Fornecedor</th>
                  </tr>
                </thead>
                <tbody>${criticalRows}</tbody>
              </table>
            </div>
          `
            : `
            <div class="empty-state">
              <h3>Estoque em nível seguro</h3>
              <p>Nenhum produto ou vacina está abaixo do estoque mínimo.</p>
            </div>
          `}
    </section>

    <section class="content-card" style="margin-top: 22px;">
      <div class="section-heading">
        <div>
          <h2>Alertas de reforço de vacina</h2>
          <p class="muted">Doses previstas para os próximos 15 dias</p>
        </div>
      </div>

      ${vacinasPendentes.length
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
          `}
    </section>
  `;
    }
    function renderTutors() {
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

      ${tutors.length
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
          `}
    </section>
  `;
    }
    const content = activeView === 'tutors'
        ? renderTutors()
        : activeView === 'pets'
            ? renderPets()
            : activeView === 'stock'
                ? renderStock()
                : activeView === 'suppliers'
                    ? renderSuppliers()
                    : renderDashboard();
    root.innerHTML = `
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
            class="nav-item ${activeView === 'stock' ? 'active' : ''}"
            data-action="go-stock"
          >
            <span>+</span> Estoque ${criticalProducts.length > 0 ? `(${criticalProducts.length})` : ''}
          </button>

          ${isAdmin
        ? `
                <button
                  class="nav-item ${activeView === 'suppliers' ? 'active' : ''}"
                  data-action="go-suppliers"
                >
                  <span>⇄</span> Fornecedores
                </button>
              `
        : ''}
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
    const filterSelect = document.querySelector('#pet-tutor-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            tutorFilterId = Number(filterSelect.value) || 0;
            render();
        });
    }
}
function render() {
    if (currentUser) {
        renderMain();
    }
    else {
        renderAuth();
    }
}
async function loadAllData() {
    const [loadedTutors, loadedPets, loadedVacinas, loadedSuppliers, loadedProducts, loadedCritical] = await Promise.all([
        window.vetcare.clinical.listTutors(),
        window.vetcare.clinical.listPets(),
        window.vetcare.notificacoes.buscarVacinasPendentes(),
        window.vetcare.stock.listSuppliers(),
        window.vetcare.stock.listProducts(),
        window.vetcare.stock.listCriticalProducts()
    ]);
    tutors = loadedTutors;
    pets = loadedPets;
    vacinasPendentes = loadedVacinas;
    suppliers = loadedSuppliers;
    products = loadedProducts;
    criticalProducts = loadedCritical;
}
function openSupplierDialog(id) {
    const supplier = id
        ? suppliers.find((item) => item.id === id)
        : undefined;
    if (id && !supplier) {
        setNotice('Fornecedor não encontrado.');
        return;
    }
    const dialog = document.querySelector('#form-dialog');
    if (!dialog)
        return;
    dialog.innerHTML = `
    <form id="supplier-form" class="modal-form">
      <div class="modal-heading">
        <div>
          <p class="eyebrow">SUPRIMENTOS</p>
          <h2>${supplier ? 'Editar fornecedor' : 'Novo fornecedor'}</h2>
        </div>

        <button
          type="button"
          class="icon-button"
          data-action="close-modal"
          aria-label="Fechar"
        >×</button>
      </div>

      <label for="supplier-nome">Razão social / Nome *</label>
      <input
        id="supplier-nome"
        name="nome"
        required
        maxlength="120"
        value="${escapeHtml(supplier?.nome)}"
      >

      <div class="form-grid">
        <div>
          <label for="supplier-moeda">Moeda de compra *</label>
          <select id="supplier-moeda" name="moeda" required>
            <option value="BRL" ${supplier?.moeda === 'BRL' ? 'selected' : ''}>
              BRL — Nacional (Real)
            </option>
            <option value="USD" ${supplier?.moeda === 'USD' ? 'selected' : ''}>
              USD — Importado (Dólar)
            </option>
          </select>
        </div>

        <div>
          <label for="supplier-pais">País *</label>
          <input
            id="supplier-pais"
            name="pais"
            required
            maxlength="80"
            value="${escapeHtml(supplier?.pais ?? 'Brasil')}"
          >
        </div>
      </div>

      <label for="supplier-documento">CNPJ ou Tax ID</label>
      <input
        id="supplier-documento"
        name="documento"
        maxlength="40"
        value="${escapeHtml(supplier?.documento)}"
      >

      <div class="form-grid">
        <div>
          <label for="supplier-email">E-mail</label>
          <input
            id="supplier-email"
            name="email"
            type="email"
            maxlength="150"
            value="${escapeHtml(supplier?.email)}"
          >
        </div>

        <div>
          <label for="supplier-telefone">Telefone</label>
          <input
            id="supplier-telefone"
            name="telefone"
            maxlength="30"
            value="${escapeHtml(supplier?.telefone)}"
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
          ${supplier ? 'Salvar alterações' : 'Cadastrar fornecedor'}
        </button>
      </div>
    </form>
  `;
    dialog.dataset.editId = supplier ? String(supplier.id) : '';
    dialog.showModal();
}
function openProductDialog(id) {
    const product = id
        ? products.find((item) => item.id === id)
        : undefined;
    if (id && !product) {
        setNotice('Produto não encontrado.');
        return;
    }
    if (suppliers.length === 0) {
        setNotice('Cadastre um fornecedor antes de adicionar itens ao estoque.');
        return;
    }
    const dialog = document.querySelector('#form-dialog');
    if (!dialog)
        return;
    const supplierOptions = suppliers
        .map((s) => `
      <option value="${s.id}" ${product?.fornecedorId === s.id ? 'selected' : ''}>
        ${escapeHtml(s.nome)} (${escapeHtml(s.moeda)})
      </option>
    `)
        .join('');
    dialog.innerHTML = `
    <form id="product-form" class="modal-form">
      <div class="modal-heading">
        <div>
          <p class="eyebrow">ESTOQUE</p>
          <h2>${product ? 'Editar produto' : 'Novo produto no estoque'}</h2>
        </div>

        <button
          type="button"
          class="icon-button"
          data-action="close-modal"
          aria-label="Fechar"
        >×</button>
      </div>

      <label for="product-fornecedor">Fornecedor *</label>
      <select id="product-fornecedor" name="fornecedorId" required>
        ${supplierOptions}
      </select>
      <small class="muted">
        Se o fornecedor for USD, o custo informado será convertido automaticamente para BRL pela cotação atual.
      </small>

      <div class="form-grid" style="margin-top: 8px;">
        <div>
          <label for="product-nome">Nome do produto / vacina *</label>
          <input
            id="product-nome"
            name="nome"
            required
            maxlength="120"
            placeholder="Ex.: Vacina V10"
            value="${escapeHtml(product?.nome)}"
          >
        </div>

        <div>
          <label for="product-categoria">Categoria *</label>
          <select id="product-categoria" name="categoria" required>
            <option value="VACINA" ${product?.categoria === 'VACINA' ? 'selected' : ''}>
              Vacina
            </option>
            <option value="MEDICAMENTO" ${product?.categoria === 'MEDICAMENTO' ? 'selected' : ''}>
              Medicamento
            </option>
            <option value="INSUMO" ${product?.categoria === 'INSUMO' ? 'selected' : ''}>
              Insumo clínico
            </option>
          </select>
        </div>
      </div>

      <div class="form-grid">
        <div>
          <label for="product-lote">Lote</label>
          <input
            id="product-lote"
            name="lote"
            maxlength="60"
            value="${escapeHtml(product?.lote)}"
          >
        </div>

        <div>
          <label for="product-validade">Validade</label>
          <input
            id="product-validade"
            name="validade"
            type="date"
            value="${escapeHtml(product?.validade)}"
          >
        </div>
      </div>

      <div class="form-grid">
        <div>
          <label for="product-quantidade">Quantidade atual *</label>
          <input
            id="product-quantidade"
            name="quantidade"
            type="number"
            min="0"
            step="1"
            value="${product?.quantidade ?? 0}"
            required
          >
        </div>

        <div>
          <label for="product-minimo">Estoque mínimo *</label>
          <input
            id="product-minimo"
            name="estoqueMinimo"
            type="number"
            min="0"
            step="1"
            value="${product?.estoqueMinimo ?? 5}"
            required
          >
        </div>
      </div>

      <label for="product-custo">Custo unitário (na moeda do fornecedor) *</label>
      <input
        id="product-custo"
        name="custo"
        type="number"
        min="0"
        step="0.01"
        value="${product?.custo ?? 0}"
        required
      >

      <label for="product-bula">Resumo da bula / observações</label>
      <textarea
        id="product-bula"
        name="bula"
        rows="3"
        maxlength="2000"
      >${escapeHtml(product?.bula)}</textarea>

      <div class="modal-actions">
        <button
          type="button"
          class="button secondary"
          data-action="close-modal"
        >
          Cancelar
        </button>

        <button type="submit" class="button primary">
          ${product ? 'Salvar alterações' : 'Salvar no estoque'}
        </button>
      </div>
    </form>
  `;
    dialog.dataset.editId = product ? String(product.id) : '';
    dialog.showModal();
}
async function handleAuthSubmit(form) {
    const formData = new FormData(form);
    if (authMode === 'register') {
        const user = await window.vetcare.auth.registerInitialAdmin({
            nome: getField(formData, 'nome'),
            email: getField(formData, 'email'),
            password: String(formData.get('password') ?? '')
        });
        currentUser = user;
    }
    else {
        const user = await window.vetcare.auth.login({
            email: getField(formData, 'email'),
            password: String(formData.get('password') ?? '')
        });
        currentUser = user;
    }
    await loadAllData();
    activeView = 'dashboard';
    notice = '';
    render();
}
async function handleTutorSubmit(form) {
    const formData = new FormData(form);
    const data = {
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
    const dialog = document.querySelector('#form-dialog');
    const editId = Number(dialog?.dataset.editId);
    if (editId > 0) {
        await window.vetcare.clinical.updateTutor(editId, data);
        notice = 'Tutor atualizado com sucesso.';
    }
    else {
        await window.vetcare.clinical.createTutor(data);
        notice = 'Tutor cadastrado com sucesso.';
    }
    dialog?.close();
    await loadAllData();
    render();
}
async function handlePetSubmit(form) {
    const formData = new FormData(form);
    const data = {
        tutorId: Number(formData.get('tutorId')),
        nome: getField(formData, 'nome'),
        especie: getField(formData, 'especie'),
        raca: getField(formData, 'raca'),
        idade: Number(formData.get('idade')),
        peso: Number(formData.get('peso')),
        observacoes: getField(formData, 'observacoes')
    };
    if (!Number.isInteger(data.tutorId) ||
        !Number.isInteger(data.idade) ||
        !Number.isFinite(data.peso) ||
        data.peso < 0 ||
        data.idade < 0) {
        throw new Error('Confira os dados informados para o pet.');
    }
    const dialog = document.querySelector('#form-dialog');
    const editId = Number(dialog?.dataset.editId);
    if (editId > 0) {
        await window.vetcare.clinical.updatePet(editId, data);
        notice = 'Pet atualizado com sucesso.';
    }
    else {
        await window.vetcare.clinical.createPet(data);
        notice = 'Pet cadastrado com sucesso.';
    }
    dialog?.close();
    await loadAllData();
    render();
}
async function handleSupplierSubmit(form) {
    const formData = new FormData(form);
    const data = {
        nome: getField(formData, 'nome'),
        documento: getField(formData, 'documento'),
        email: getField(formData, 'email'),
        telefone: getField(formData, 'telefone'),
        pais: getField(formData, 'pais'),
        moeda: getField(formData, 'moeda')
    };
    const dialog = document.querySelector('#form-dialog');
    const editId = Number(dialog?.dataset.editId);
    if (editId > 0) {
        await window.vetcare.stock.updateSupplier(editId, data);
        notice = 'Fornecedor atualizado com sucesso.';
    }
    else {
        await window.vetcare.stock.createSupplier(data);
        notice = 'Fornecedor cadastrado com sucesso.';
    }
    dialog?.close();
    await loadAllData();
    render();
}
async function handleProductSubmit(form) {
    const formData = new FormData(form);
    const fornecedorId = Number(formData.get('fornecedorId'));
    const supplier = suppliers.find((s) => s.id === fornecedorId);
    const data = {
        fornecedorId,
        nome: getField(formData, 'nome'),
        categoria: getField(formData, 'categoria'),
        lote: getField(formData, 'lote'),
        validade: getField(formData, 'validade'),
        quantidade: Number(formData.get('quantidade')),
        estoqueMinimo: Number(formData.get('estoqueMinimo')),
        bula: getField(formData, 'bula'),
        custo: Number(formData.get('custo'))
    };
    const dialog = document.querySelector('#form-dialog');
    const editId = Number(dialog?.dataset.editId);
    if (editId > 0) {
        await window.vetcare.stock.updateProduct(editId, data);
        notice =
            supplier?.moeda === 'USD'
                ? 'Produto atualizado e custo convertido automaticamente de USD para BRL.'
                : 'Produto atualizado com sucesso.';
    }
    else {
        await window.vetcare.stock.createProduct(data);
        notice =
            supplier?.moeda === 'USD'
                ? 'Produto importado cadastrado com conversão automática USD → BRL!'
                : 'Produto cadastrado no estoque com sucesso.';
    }
    dialog?.close();
    await loadAllData();
    render();
}
async function handleClick(event) {
    const target = event.target;
    if (!(target instanceof Element))
        return;
    const button = target.closest('button[data-action]');
    if (!button)
        return;
    const action = button.dataset.action;
    const id = Number(button.dataset.id);
    try {
        switch (action) {
            case 'toggle-auth':
                authMode = authMode === 'login' ? 'register' : 'login';
                notice = '';
                render();
                break;
            case 'close-modal':
                document.querySelector('#form-dialog')?.close();
                break;
            case 'delete-tutor':
                if (confirm('Deseja realmente excluir este tutor?')) {
                    await window.vetcare.clinical.deleteTutor(id);
                    await loadAllData();
                    setNotice('Tutor excluído com sucesso.');
                }
                break;
            case 'delete-pet':
                if (confirm('Deseja realmente excluir este pet?')) {
                    await window.vetcare.clinical.deletePet(id);
                    await loadAllData();
                    setNotice('Pet excluído com sucesso.');
                }
                break;
            case 'delete-supplier':
                if (confirm('Deseja realmente excluir este fornecedor?')) {
                    await window.vetcare.stock.deleteSupplier(id);
                    await loadAllData();
                    setNotice('Fornecedor excluído com sucesso.');
                }
                break;
            case 'delete-product':
                if (confirm('Deseja realmente excluir este item do estoque?')) {
                    await window.vetcare.stock.deleteProduct(id);
                    await loadAllData();
                    setNotice('Item removido do estoque com sucesso.');
                }
                break;
            case 'send-vaccine-reminders': {
                const res = await window.vetcare.notificacoes.enviarNotificacoes();
                setNotice(`Notificações Brevo: ${res.enviados} enviado(s), ${res.ignorados} ignorado(s), ${res.falhas} falha(s).`);
                break;
            }
            case 'logout':
                await window.vetcare.auth.logout();
                currentUser = null;
                tutors = [];
                pets = [];
                suppliers = [];
                products = [];
                criticalProducts = [];
                vacinasPendentes = [];
                usdRateInfo = null;
                authMode = 'login';
                notice = '';
                render();
                break;
        }
    }
    catch (error) {
        setNotice(formatError(error, 'Não foi possível executar a operação.'));
    }
}
async function handleSubmit(event) {
    const target = event.target;
    if (!(target instanceof HTMLFormElement))
        return;
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
            case 'supplier-form':
                await handleSupplierSubmit(target);
                break;
            case 'product-form':
                await handleProductSubmit(target);
                break;
        }
    }
    catch (error) {
        setNotice(formatError(error, 'Não foi possível salvar os dados.'));
    }
}
root.addEventListener('click', (event) => {
    void handleClick(event);
});
root.addEventListener('submit', (event) => {
    void handleSubmit(event);
});
async function initialize() {
    try {
        currentUser = await window.vetcare.auth.getCurrentUser();
        if (currentUser) {
            await loadAllData();
        }
    }
    catch {
        currentUser = null;
        notice = 'Não foi possível recuperar a sessão anterior.';
    }
    render();
}
void initialize();
export {};
