import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class MailerService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.OUTLOOK_EMAIL,
        pass: process.env.OUTLOOK_PASSWORD,
      },
    });
  }

 private getTemplate(templateName: string, context: Record<string, string>) {
  const filePath = join(process.cwd(), 'src', 'email-templates', `${templateName}.html`);

  let html = readFileSync(filePath, 'utf8');

  for (const key in context) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    html = html.replace(regex, context[key]);
  }

  return html;
}

  async sendTemplateMail(
    to: string,
    subject: string,
    templateName: string,
    context: Record<string, string>,
  ) {
    const html = this.getTemplate(templateName, context);
    return this.transporter.sendMail({
      from: `"IPL App" <${process.env.OUTLOOK_EMAIL}>`,
      to,
      subject,
      html,
    });
  }

}

