import { supabase } from '../lib/supabase';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { logger } from '../lib/logger';

// Hardened validation schema with security constraints
const TemplateSchema = z.object({
    logo_url: z.string()
        .max(500, 'URL too long')
        .refine(val => !val || val === '' || (val.startsWith('https://') && isValidHttpsUrl(val)), {
            message: 'Logo URL must be HTTPS and valid'
        })
        .optional()
        .or(z.literal('')),
    primary_color: z.string()
        .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color format')
        .optional(),
    accent_color: z.string()
        .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color format')
        .optional(),
    footer_text: z.string()
        .max(200, 'Footer text too long')
        .optional(),
    font_variant: z.enum(['inter', 'roboto', 'mono']).optional()
});

// Allowed MIME types for logo images
const ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/svg+xml',
    'image/webp'
];

const MAX_LOGO_SIZE_MB = 5;

export interface ReceiptTemplate {
    logo_url?: string;
    primary_color?: string;
    accent_color?: string;
    footer_text?: string;
    font_variant?: string;
}

/**
 * Validate HTTPS URL format
 */
function isValidHttpsUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString);
        return url.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Validate logo URL by checking file size and MIME type
 */
async function validateLogoUrl(url: string): Promise<void> {
    if (!url || url === '') return;

    try {
        // Make HEAD request to check size and MIME type
        const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });

        if (!response.ok) {
            throw new Error(`Failed to fetch logo: ${response.status}`);
        }

        // Check MIME type
        const contentType = response.headers.get('content-type');
        if (!contentType || !ALLOWED_MIME_TYPES.includes(contentType.toLowerCase())) {
            throw new Error(`Invalid image type: ${contentType}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
        }

        // Check file size
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
            const sizeInMB = parseInt(contentLength) / (1024 * 1024);
            if (sizeInMB > MAX_LOGO_SIZE_MB) {
                throw new Error(`Logo file too large: ${sizeInMB.toFixed(2)}MB (max: ${MAX_LOGO_SIZE_MB}MB)`);
            }
        }
    } catch (error: any) {
        logger.warn('Logo URL validation failed', { url, error: error.message });
        throw new Error(`Logo URL validation failed: ${error.message}`);
    }
}

/**
 * Sanitize footer text to prevent XSS
 */
function sanitizeFooterText(text: string | undefined): string | undefined {
    if (!text) return text;

    // Remove all HTML tags and dangerous characters
    const sanitized = DOMPurify.sanitize(text, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
    });

    // Additional safety: remove any remaining script-like patterns
    return sanitized
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
}

export class TemplateService {

    async getTemplate(apiKeyId: string): Promise<ReceiptTemplate | null> {
        const { data, error } = await supabase
            .from('receipt_templates')
            .select('*')
            .eq('api_key_id', apiKeyId)
            .single();

        if (error || !data) return null;

        return {
            logo_url: data.logo_url,
            primary_color: data.primary_color,
            accent_color: data.accent_color,
            footer_text: data.footer_text,
            font_variant: data.font_variant
        };
    }

    async saveTemplate(apiKeyId: string, payload: any) {
        // Validate schema
        const parsed = TemplateSchema.parse(payload);

        // Validate logo URL (async validation)
        if (parsed.logo_url && parsed.logo_url !== '') {
            await validateLogoUrl(parsed.logo_url);
        }

        // Sanitize footer text
        const sanitizedFooter = sanitizeFooterText(parsed.footer_text);

        // Upsert with sanitized data
        const { error } = await supabase
            .from('receipt_templates')
            .upsert({
                api_key_id: apiKeyId,
                logo_url: parsed.logo_url || null,
                primary_color: parsed.primary_color || null,
                accent_color: parsed.accent_color || null,
                footer_text: sanitizedFooter || null,
                font_variant: parsed.font_variant || 'inter',
                updated_at: new Date().toISOString()
            }, { onConflict: 'api_key_id' });

        if (error) {
            logger.error('Failed to save template', { apiKeyId, error: error.message });
            throw error;
        }

        logger.info('Template saved', { apiKeyId });

        return {
            ...parsed,
            footer_text: sanitizedFooter
        };
    }
}
