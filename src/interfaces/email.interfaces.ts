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