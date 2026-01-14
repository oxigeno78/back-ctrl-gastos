import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { EmailProvider, SendEmailOptions, SesProviderConfig } from "../interfaces/email.interfaces";

export class SesProvider implements EmailProvider {
    private client: SESv2Client;
    private from: string;

    constructor(config: SesProviderConfig) {
        this.from = config.from;

        // Si no se pasan credenciales/región, el SDK usará la default provider chain:
        // env vars (AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY/AWS_REGION), shared config/credentials, IAM role, etc.
        const clientConfig: ConstructorParameters<typeof SESv2Client>[0] = {};
        if (config.region) clientConfig.region = config.region;
        if (config.accessKeyId && config.secretAccessKey) {
            clientConfig.credentials = {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            };
        }

        this.client = new SESv2Client(clientConfig);
    }

    async sendMail(options: SendEmailOptions): Promise<void> {
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
                ConfigurationSetName: 'nizerapp',
            })
        );
    }
}