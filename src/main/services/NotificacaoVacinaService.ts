import { DatabaseConnection } from '../database/DatabaseConnection';
import { BrevoEmailService } from './BrevoEmailService';

import type {
  VacinaPendente,
  ResultadoNotificacoes
} from '../../shared/notification-types';

interface VacinaPendenteBanco {
  prescricao_id: number;
  tutor_nome: string;
  tutor_email: string | null;
  pet_nome: string;
  produto_nome: string;
  proxima_dose: string;
}

interface RegistroNotificacao {
  id: number;
  status: 'PENDENTE' | 'ENVIADO' | 'FALHA';
}

export class NotificacaoVacinaService {
  private readonly database: DatabaseConnection;
  private readonly emailService: BrevoEmailService;

  constructor(
    database: DatabaseConnection = DatabaseConnection.getInstance(),
    emailService: BrevoEmailService = new BrevoEmailService()
  ) {
    this.database = database;
    this.emailService = emailService;
  }

  /**
   * Busca vacinas com reforço previsto para os próximos 15 dias.
   */
  public buscarVacinasPendentes(): VacinaPendenteBanco[] {
    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);

    const limite = new Date(hoje);
    limite.setUTCDate(limite.getUTCDate() + 15);

    const dataInicial = hoje.toISOString().slice(0, 10);
    const dataFinal = limite.toISOString().slice(0, 10);

    return this.database.query<VacinaPendenteBanco>(
      `SELECT
        pa.id AS prescricao_id,
        t.nome AS tutor_nome,
        t.email AS tutor_email,
        p.nome AS pet_nome,
        pe.nome AS produto_nome,
        pa.proxima_dose
      FROM prescricoes_aplicacoes pa
      INNER JOIN consultas c ON c.id = pa.consulta_id
      INNER JOIN pets p ON p.id = c.pet_id
      INNER JOIN tutores t ON t.id = p.tutor_id
      INNER JOIN produtos_estoque pe ON pe.id = pa.produto_id
      WHERE pa.proxima_dose >= ?
        AND pa.proxima_dose <= ?
        AND pa.proxima_dose IS NOT NULL
      ORDER BY pa.proxima_dose ASC`,
      [dataInicial, dataFinal]
    );
  }

  /**
   * Retorna somente os registros que possuem e-mail.
   */
  public buscarVacinasComEmail(): Array<
  VacinaPendente & { tutor_email: string }
> {
    return this.buscarVacinasPendentes().filter(
      (vacina): vacina is VacinaPendente & {
        tutor_email: string;
      } =>
        typeof vacina.tutor_email === 'string' &&
        vacina.tutor_email.trim().length > 0
    );
  }

  /**
   * Envia lembretes e registra os resultados no banco.
   */
  public async enviarNotificacoes(): Promise<ResultadoNotificacoes> {
    const vacinas = this.buscarVacinasComEmail();

    const resultado: ResultadoNotificacoes = {
      total: vacinas.length,
      enviados: 0,
      falhas: 0,
      ignorados: 0
    };

    for (const vacina of vacinas) {
      try {
        const registros = this.database.query<RegistroNotificacao>(
          `SELECT id, status
           FROM notificacoes_vacina
           WHERE prescricao_id = ?
             AND proxima_dose = ?
             AND email_destino = ?`,
          [
            vacina.prescricao_id,
            vacina.proxima_dose,
            vacina.tutor_email
          ]
        );

        const registro = registros[0];

        if (
          registro?.status === 'ENVIADO' ||
          registro?.status === 'PENDENTE'
        ) {
          resultado.ignorados++;
          continue;
        }

        if (registro) {
          this.database.execute(
            `UPDATE notificacoes_vacina
             SET status = 'PENDENTE'
             WHERE id = ?`,
            [registro.id]
          );
        } else {
          this.database.execute(
            `INSERT INTO notificacoes_vacina
              (prescricao_id, proxima_dose, email_destino, status)
             VALUES (?, ?, ?, 'PENDENTE')`,
            [
              vacina.prescricao_id,
              vacina.proxima_dose,
              vacina.tutor_email
            ]
          );
        }

        await this.emailService.enviarEmail({
          destinatario: vacina.tutor_email,
          nomeDestinatario: vacina.tutor_nome,
          assunto: `Lembrete de vacinação: ${vacina.pet_nome}`,
          mensagem:
            `Olá, ${vacina.tutor_nome}!\n\n` +
            `A próxima dose de ${vacina.produto_nome} ` +
            `para o pet ${vacina.pet_nome} está prevista para ` +
            `${vacina.proxima_dose}.\n\n` +
            'Entre em contato com a clínica para agendar.'
        });

        this.database.execute(
          `UPDATE notificacoes_vacina
           SET status = 'ENVIADO',
               enviado_em = CURRENT_TIMESTAMP
           WHERE prescricao_id = ?
             AND proxima_dose = ?
             AND email_destino = ?`,
          [
            vacina.prescricao_id,
            vacina.proxima_dose,
            vacina.tutor_email
          ]
        );

        resultado.enviados++;
      } catch {
        resultado.falhas++;

        this.database.execute(
          `UPDATE notificacoes_vacina
           SET status = 'FALHA'
           WHERE prescricao_id = ?
             AND proxima_dose = ?
             AND email_destino = ?`,
          [
            vacina.prescricao_id,
            vacina.proxima_dose,
            vacina.tutor_email
          ]
        );
      }
    }

    return resultado;
  }
}