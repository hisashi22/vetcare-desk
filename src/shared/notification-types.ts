export interface VacinaPendente {
  prescricao_id: number;
  tutor_nome: string;
  tutor_email: string | null;
  pet_nome: string;
  produto_nome: string;
  proxima_dose: string;
}

export interface ResultadoNotificacoes {
  total: number;
  enviados: number;
  falhas: number;
  ignorados: number;
}
