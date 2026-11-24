"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrevoEmailService = void 0;
class BrevoEmailService {
    apiKey;
    senderEmail;
    senderName;
    constructor() {
        this.apiKey = process.env.BREVO_API_KEY ?? '';
        this.senderEmail = process.env.BREVO_SENDER_EMAIL ?? '';
        this.senderName = process.env.BREVO_SENDER_NAME ?? 'VetCare';
    }
    async enviarEmail(options) {
        if (!this.apiKey || !this.senderEmail) {
            throw new Error('Configurações da Brevo não encontradas no ambiente.');
        }
        if (!options.destinatario.trim() ||
            !options.nomeDestinatario.trim() ||
            !options.assunto.trim() ||
            !options.mensagem.trim()) {
            throw new Error('Dados do e-mail incompletos.');
        }
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'api-key': this.apiKey
            },
            body: JSON.stringify({
                sender: {
                    name: this.senderName,
                    email: this.senderEmail
                },
                to: [
                    {
                        email: options.destinatario,
                        name: options.nomeDestinatario
                    }
                ],
                subject: options.assunto,
                textContent: options.mensagem
            }),
            signal: AbortSignal.timeout(15000)
        });
        if (!response.ok) {
            throw new Error(`Falha no envio pela Brevo. Código HTTP: ${response.status}.`);
        }
    }
}
exports.BrevoEmailService = BrevoEmailService;
