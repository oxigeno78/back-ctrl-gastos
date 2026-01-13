import { EmailProvider, SendEmailOptions } from "../interfaces/email.interfaces";
import sgMail from "@sendgrid/mail";

export class SendGridProvider implements EmailProvider {
    constructor(apiKey: string) {
        sgMail.setApiKey(apiKey);
    }

    async sendMail(options: SendEmailOptions): Promise<void> {
        await sgMail.send({
            to: options.to as any,
            from: options.from!,
            subject: options.subject,
            html: options.html,
            text: options.text!,
        });
    }
}