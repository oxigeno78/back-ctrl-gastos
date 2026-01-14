export interface SendEmailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

export interface EmailProvider {
  sendMail(options: SendEmailOptions): Promise<void>;
}

export interface SesProviderConfig {
  region?: string;
  from: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}