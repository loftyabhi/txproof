import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { BillViewModel } from './BillService';

// Singleton template cache to avoid reading/compiling on every request
let cachedTemplate: Handlebars.TemplateDelegate<any> | null = null;

const registerHelpers = () => {
    Handlebars.registerHelper('eq', function (a, b) { return a === b; });
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

    return cachedTemplate(billData);
}
