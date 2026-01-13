import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { EmailProvider, SendEmailOptions } from "../interfaces/email.interfaces";
import { logger } from "../utils/logger";

export class SesProvider implements EmailProvider {
    private client: SESv2Client;
    private from: string;

    constructor(config: { region: string; from: string; accessKeyId?: string; secretAccessKey?: string }) {
        logger.debug('Configurando SesProvider', config.region, config.from, config.accessKeyId);
        this.from = config.from;

        this.client = new SESv2Client({
            region: config.region,
            credentials: config.accessKeyId && config.secretAccessKey
                ? {
                    accessKeyId: config.accessKeyId,
                    secretAccessKey: config.secretAccessKey!,
                }
                : undefined,
        });
    }

    async sendMail(options: SendEmailOptions): Promise<void> {
        logger.debug('Enviando email con SES:', options.to);
        await this.client.send(
            new SendEmailCommand({
                FromEmailAddress: options.from ?? this.from,
                Destination: {
                    ToAddresses: Array.isArray(options.to)
                        ? options.to
                        : [options.to],
                },
                Content: {
                    Simple: {
                        Subject: { Data: options.subject },
                        Body: {
                            ...(options.html && {
                                Html: { Data: options.html },
                            }),
                            ...(options.text && {
                                Text: { Data: options.text },
                            }),
                        },
                    },
                },
            })
        );
    }
}