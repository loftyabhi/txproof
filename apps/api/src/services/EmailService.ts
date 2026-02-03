import nodemailer from 'nodemailer';
import { logger } from '../lib/logger';

export interface IEmailProvider {
    send(mailOptions: {
        from: string;
        to: string;
        subject: string;
        html: string;
    }): Promise<void>;
}

export class NodemailerProvider implements IEmailProvider {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail', // Fallback for now, but provider setup is now abstract
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });
    }

    async send(mailOptions: any) {
        await this.transporter.sendMail(mailOptions);
    }
}

export class EmailService {
    constructor(private provider: IEmailProvider = new NodemailerProvider()) { }

    async sendVerificationEmail(email: string, token: string) {
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://txproof.xyz'}/verify?token=${token}`;
        const expiryMinutes = 15;

        const mailOptions = {
            from: `"TxProof Support" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Verify Your Email - TxProof Developers',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #333;">Email Verification</h2>
                    <p>Hello,</p>
                    <p>Thank you for signing up for the TxProof Developer Console. Please click the button below to verify your email address. This link is valid for <b>${expiryMinutes} minutes</b>.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
                    </div>
                    <p style="color: #666; font-size: 14px;">If you did not request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
                    <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} TxProof Protocol. All rights reserved.</p>
                </div>
            `
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
