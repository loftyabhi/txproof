import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { logger } from '../lib/logger';

export interface IEmailOptions {
    from: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export interface IEmailProvider {
    send(mailOptions: IEmailOptions): Promise<void>;
}

export class NodemailerProvider implements IEmailProvider {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });
    }

    async send(mailOptions: IEmailOptions) {
        await this.transporter.sendMail(mailOptions);
    }
}

export class EmailService {
    constructor(private provider: IEmailProvider = new NodemailerProvider()) { }

    private renderTemplate(templateName: string, data: Record<string, string>): { html: string; text: string } {
        const templatesDir = path.join(__dirname, 'email/templates');

        // Base paths
        const baseHtmlPath = path.join(templatesDir, 'base.html');
        const contentHtmlPath = path.join(templatesDir, `${templateName}.html`);
        const contentTextPath = path.join(templatesDir, `${templateName}.txt`);

        // Load files
        const baseHtml = fs.readFileSync(baseHtmlPath, 'utf-8');
        const contentHtmlSource = fs.readFileSync(contentHtmlPath, 'utf-8');
        const contentTextSource = fs.readFileSync(contentTextPath, 'utf-8');

        // Inject content into base
        let html = baseHtml.replace('{{content}}', contentHtmlSource);
        let text = contentTextSource;

        // Populate variables
        const allData = {
            ...data,
            year: new Date().getFullYear().toString()
        };

        for (const [key, value] of Object.entries(allData)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, value);
            text = text.replace(regex, value);
        }

        return { html, text };
    }

    async sendVerificationEmail(email: string, token: string) {
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://txproof.xyz'}/verify?token=${token}`;
        const expiryMinutes = 15;

        const { html, text } = this.renderTemplate('verification', {
            subject: 'Verify Your Email - TxProof Developers',
            verifyUrl: verificationUrl,
            expiryMinutes: expiryMinutes.toString()
        });

        const mailOptions: IEmailOptions = {
            from: `"TxProof Support" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Verify Your Email - TxProof Developers',
            html,
            text
        };

        try {
            await this.provider.send(mailOptions);
            logger.info('Verification email sent', { email });
        } catch (error: any) {
            logger.error('Failed to send verification email', { email, error: error.message });
            throw new Error('Could not send verification email. Please try again later.');
        }
    }
}
