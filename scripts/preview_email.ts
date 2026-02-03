import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

function renderPreview() {
    const templatesDir = path.join(__dirname, '../apps/api/src/services/email/templates');
    const baseHtml = fs.readFileSync(path.join(templatesDir, 'base.html'), 'utf-8');
    const contentHtml = fs.readFileSync(path.join(templatesDir, 'verification.html'), 'utf-8');

    const data: Record<string, string> = {
        subject: 'Verify Your Email - TxProof Developers',
        verifyUrl: 'https://txproof.xyz/verify?token=preview_token_123',
        expiryMinutes: '15',
        year: new Date().getFullYear().toString(),
        content: contentHtml
    };

    let rendered = baseHtml;
    for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, value);
    }

    const previewPath = path.join(__dirname, '../temp_email_preview.html');
    fs.writeFileSync(previewPath, rendered);

    console.log(`Preview generated at: ${previewPath}`);

    // Windows specific open
    exec(`start "" "${previewPath}"`);
}

renderPreview();
