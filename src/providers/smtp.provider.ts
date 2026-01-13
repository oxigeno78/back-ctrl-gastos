import { EmailProvider, SendEmailOptions } from "../interfaces/email.interfaces";
import * as nodemailer from 'nodemailer';

export class SmtpProvider implements EmailProvider {
    private transporter: nodemailer.Transporter;

    constructor(config: {
        host: string;
        port: number;
        user: string;
        pass: string;
    }) {
        this.transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.port === 465,
            auth: {
                user: config.user,
                pass: config.pass,
            },
        });
    }

    async sendMail(options: SendEmailOptions): Promise<void> {
        await this.transporter.sendMail(options);
    }
}