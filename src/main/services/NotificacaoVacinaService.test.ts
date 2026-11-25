
import test from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs, { Database } from 'sql.js';
import { NotificacaoVacinaService } from './NotificacaoVacinaService';

async function createTestContext(falharEnvio = false) {
  const SQL = await initSqlJs();
  const db: Database = new SQL.Database();

  db.run(`
    CREATE TABLE tutores (
      id INTEGER PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT
    );

    CREATE TABLE pets (
      id INTEGER PRIMARY KEY,
      tutor_id INTEGER NOT NULL,
      nome TEXT NOT NULL
    );

    CREATE TABLE veterinarios (
      id INTEGER PRIMARY KEY
    );

    CREATE TABLE consultas (
      id INTEGER PRIMARY KEY,
      pet_id INTEGER NOT NULL,
      veterinario_id INTEGER NOT NULL
    );

    CREATE TABLE produtos_estoque (
      id INTEGER PRIMARY KEY,
      nome TEXT NOT NULL
    );

    CREATE TABLE prescricoes_aplicacoes (
      id INTEGER PRIMARY KEY,
      consulta_id INTEGER NOT NULL,
      produto_id INTEGER NOT NULL,
      proxima_dose TEXT
    );

    CREATE TABLE notificacoes_vacina (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prescricao_id INTEGER NOT NULL,
      proxima_dose TEXT NOT NULL,
      email_destino TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDENTE',
      enviado_em TEXT,
      UNIQUE (prescricao_id, proxima_dose, email_destino)
    );
  `);

  const memoryDatabase = {
    query<T = Record<string, unknown>>(
      sql: string,
      params: unknown[] = []
    ): T[] {
      const statement = db.prepare(sql);
      const results: T[] = [];

      try {
        statement.bind(
          params as (string | number | null | Uint8Array)[]
        );

        while (statement.step()) {
          results.push(statement.getAsObject() as T);
        }
      } finally {
        statement.free();
      }

      return results;
    },

    execute(sql: string, params: unknown[] = []): void {
      db.run(
        sql,
        params as (string | number | null | Uint8Array)[]
      );
    }
  };

  const emailService = {
    async enviarEmail(): Promise<void> {
      if (falharEnvio) {
        throw new Error('Falha simulada no envio.');
      }
    }
  };

  const service = new NotificacaoVacinaService(
    memoryDatabase as never,
    emailService as never
  );

  return { service, db };
}

function prepararVacina(db: Database): void {
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  hoje.setUTCDate(hoje.getUTCDate() + 3);

  const data = hoje.toISOString().slice(0, 10);

  db.run(`
    INSERT INTO tutores VALUES
      (1, 'Tutor Teste', 'tutor@email.com');

    INSERT INTO pets VALUES
      (1, 1, 'Rex');

    INSERT INTO veterinarios VALUES (1);

    INSERT INTO consultas VALUES
      (1, 1, 1);

    INSERT INTO produtos_estoque VALUES
      (1, 'Vacina Antirrábica');

    INSERT INTO prescricoes_aplicacoes VALUES
      (1, 1, 1, '${data}');
  `);
}

test('deve buscar vacinas pendentes ordenadas por data', async () => {
  const { service, db } = await createTestContext();

  try {
    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);

    const data1 = new Date(hoje);
    data1.setUTCDate(data1.getUTCDate() + 5);

    const data2 = new Date(hoje);
    data2.setUTCDate(data2.getUTCDate() + 2);

    const data3 = new Date(hoje);
    data3.setUTCDate(data3.getUTCDate() + 10);

    const formatar = (data: Date) =>
      data.toISOString().slice(0, 10);

    db.run(`
      INSERT INTO tutores VALUES
        (1, 'Tutor 1', 'tutor1@email.com'),
        (2, 'Tutor 2', 'tutor2@email.com');

      INSERT INTO pets VALUES
        (1, 1, 'Rex'),
        (2, 2, 'Luna');

      INSERT INTO veterinarios VALUES (1);

      INSERT INTO consultas VALUES
        (1, 1, 1),
        (2, 2, 1);

      INSERT INTO produtos_estoque VALUES
        (1, 'Vacina A'),
        (2, 'Vacina B'),
        (3, 'Vacina C');

      INSERT INTO prescricoes_aplicacoes VALUES
        (1, 1, 1, '${formatar(data1)}'),
        (2, 2, 2, '${formatar(data2)}'),
        (3, 1, 3, '${formatar(data3)}');
    `);

    const resultado = service.buscarVacinasPendentes();

    assert.equal(resultado.length, 3);
    assert.equal(resultado[0].prescricao_id, 2);
    assert.equal(resultado[1].prescricao_id, 1);
    assert.equal(resultado[2].prescricao_id, 3);
  } finally {
    db.close();
  }
});

test('deve filtrar tutores sem e-mail', async () => {
  const { service, db } = await createTestContext();

  try {
    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);
    hoje.setUTCDate(hoje.getUTCDate() + 3);

    const data = hoje.toISOString().slice(0, 10);

    db.run(`
      INSERT INTO tutores VALUES
        (1, 'Tutor Com Email', 'tutor@email.com'),
        (2, 'Tutor Sem Email', NULL),
        (3, 'Tutor Email Vazio', '');

      INSERT INTO pets VALUES
        (1, 1, 'Rex'),
        (2, 2, 'Luna'),
        (3, 3, 'Bob');

      INSERT INTO veterinarios VALUES (1);

      INSERT INTO consultas VALUES
        (1, 1, 1),
        (2, 2, 1),
        (3, 3, 1);

      INSERT INTO produtos_estoque VALUES
        (1, 'Vacina A'),
        (2, 'Vacina B'),
        (3, 'Vacina C');

      INSERT INTO prescricoes_aplicacoes VALUES
        (1, 1, 1, '${data}'),
        (2, 2, 2, '${data}'),
        (3, 3, 3, '${data}');
    `);

    const resultado = service.buscarVacinasComEmail();

    assert.equal(resultado.length, 1);
    assert.equal(resultado[0].tutor_email, 'tutor@email.com');
  } finally {
    db.close();
  }
});

test('deve registrar notificação enviada', async () => {
  const { service, db } = await createTestContext();

  try {
    prepararVacina(db);

    const resultado = await service.enviarNotificacoes();

    assert.equal(resultado.enviados, 1);
    assert.equal(resultado.falhas, 0);

    const registros = db.exec(
      'SELECT status, enviado_em FROM notificacoes_vacina'
    );

    assert.equal(registros[0].values[0][0], 'ENVIADO');
    assert.ok(registros[0].values[0][1]);
  } finally {
    db.close();
  }
});

test('não deve enviar novamente uma notificação já enviada', async () => {
  const { service, db } = await createTestContext();

  try {
    prepararVacina(db);

    await service.enviarNotificacoes();

    const resultado = await service.enviarNotificacoes();

    assert.equal(resultado.enviados, 0);
    assert.equal(resultado.ignorados, 1);
  } finally {
    db.close();
  }
});

test('deve registrar falha quando o envio não funcionar', async () => {
  const { service, db } = await createTestContext(true);

  try {
    prepararVacina(db);

    const resultado = await service.enviarNotificacoes();

    assert.equal(resultado.enviados, 0);
    assert.equal(resultado.falhas, 1);

    const registros = db.exec(
      'SELECT status FROM notificacoes_vacina'
    );

    assert.equal(registros[0].values[0][0], 'FALHA');
  } finally {
    db.close();
  }
});
