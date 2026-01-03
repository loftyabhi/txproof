import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { BillViewModel } from './BillService';

// Singleton template cache to avoid reading/compiling on every request
let cachedTemplate: Handlebars.TemplateDelegate<any> | null = null;

const registerHelpers = () => {
    Handlebars.registerHelper('eq', function (a, b) { return a === b; });
};

// Font Cache
let cachedFontCss: string | null = null;

const getLocalFontCss = () => {
    if (cachedFontCss) return cachedFontCss;

    // Try multiple paths for robust loading in both Dev (src) and Prod (dist)
    const possiblePaths = [
        path.join(process.cwd(), 'src', 'assets', 'fonts'), // Dev / Source
        path.join(process.cwd(), 'assets', 'fonts'),        // Docker / Prod root
        path.join(__dirname, '..', 'assets', 'fonts')       // Relative to service file
    ];

    let fontDir = '';
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            fontDir = p;
            break;
        }
    }

    if (!fontDir) {
        console.warn('[PdfTemplateHelper] PDF_FONT_FALLBACK_USED: Font directory not found in any known location.');
        return ''; // Fallback to system fonts
    }

    const loadFont = (file: string) => {
        try {
            return fs.readFileSync(path.join(fontDir, file)).toString('base64');
        } catch (e) {
            console.warn(`[PdfTemplateHelper] Failed to load local font: ${file}`);
            return '';
        }
    };

    // Load fonts (Inter & JetBrains Mono)
    const fonts = {
        'Inter-Regular.ttf': { family: 'Inter', weight: 400 },
        'Inter-Medium.ttf': { family: 'Inter', weight: 500 },
        'Inter-SemiBold.ttf': { family: 'Inter', weight: 600 },
        'Inter-Bold.ttf': { family: 'Inter', weight: 700 },
        'JetBrainsMono-Regular.ttf': { family: 'JetBrains Mono', weight: 400 },
        'JetBrainsMono-Medium.ttf': { family: 'JetBrains Mono', weight: 500 },
    };

    let css = '';
    let successCount = 0;

    for (const [file, meta] of Object.entries(fonts)) {
        const b64 = loadFont(file);
        if (b64) {
            css += `
                @font-face {
                    font-family: '${meta.family}';
                    font-style: normal;
                    font-weight: ${meta.weight};
                    font-display: swap;
                    src: url(data:font/ttf;base64,${b64}) format('truetype');
                }
            `;
            successCount++;
        }
    }

    if (successCount === 0) {
        console.warn('[PdfTemplateHelper] PDF_FONT_FALLBACK_USED: No fonts were loaded successfully.');
    }

    cachedFontCss = css;
    return css;
};

/**
 * Renders the HTML for the bill using a cached template.
 * Returns the CLEAN HTML without any regex manipulation.
 * Layout control (First Page vs Subsequent Pages) is handled via Puppeteer CSS injection.
 */
export function renderBillHtml(billData: BillViewModel): string {
    if (!cachedTemplate) {
        const templatePath = path.join(process.cwd(), 'templates', 'final_templete.html');
        // Ensure template exists, otherwise throw
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found at ${templatePath}`);
        }
        const templateHtml = fs.readFileSync(templatePath, 'utf8');

        registerHelpers(); // Register once
        cachedTemplate = Handlebars.compile(templateHtml);
    }

    const html = cachedTemplate(billData);
    const fontCss = getLocalFontCss();

    // Deterministic Replacement of Placeholder
    if (html.includes('<!-- FONT_STYLES -->')) {
        // Inject specific style block if we have fonts, else remove placeholder
        return html.replace('<!-- FONT_STYLES -->', fontCss ? `<style>${fontCss}</style>` : '');
    }

    // Legacy Fallback (should not happen if template is updated)
    if (fontCss) {
        const googleFontLinkRegex = /<link[^>]*href="https:\/\/fonts\.googleapis\.com[^>]*>/i;
        if (googleFontLinkRegex.test(html)) {
            return html.replace(googleFontLinkRegex, `<style>${fontCss}</style>`);
        }
        return html.replace('</head>', `<style>${fontCss}</style></head>`);
    }

    return html;
}
