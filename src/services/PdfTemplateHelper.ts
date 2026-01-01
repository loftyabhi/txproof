import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

/**
 * Renders ONLY the first page HTML (with full custom header, no running header)
 * This page will be rendered WITHOUT Puppeteer's displayHeaderFooter
 */
export function renderFirstPageHTML(billData: any): string {
    const templatePath = path.join(process.cwd(), 'templates', 'final_templete.html');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');

    // Register Handlebars helpers
    Handlebars.registerHelper('eq', function (a, b) { return a === b; });

    const template = Handlebars.compile(templateHtml);
    const fullHtml = template(billData);

    // Extract first page content (everything before running header or major page break)
    // Strategy: Keep everything up to and including the main header, but remove running-header div
    // and add a style to force page break after first logical page
    const modifiedHtml = fullHtml
        .replace(/<div class="running-header">[\s\S]*?<\/div>/g, '') // Remove running header entirely
        .replace(/<div class="page-content">/g, '<div class="page-content" style="page-break-after: always;">'); // Force page break

    return modifiedHtml;
}

/**
 * Renders pages 2+ HTML (content continuation, NO custom headers)
 * This will be rendered WITH Puppeteer's displayHeaderFooter
 */
export function renderRemainingPagesHTML(billData: any): string {
    const templatePath = path.join(process.cwd(), 'templates', 'final_templete.html');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');

    Handlebars.registerHelper('eq', function (a, b) { return a === b; });

    const template = Handlebars.compile(templateHtml);
    const fullHtml = template(billData);

    // Remove the first-page-header wrapper and main header
    // Keep running-header for context but it won't display (Puppeteer header will)
    const modifiedHtml = fullHtml
        .replace(/<div class="first-page-header">[\s\S]*?<\/div>\s*<!-- End first-page-header -->/g, '')
        .replace(/<header class="header">[\s\S]*?<\/header>/g, '');

    return modifiedHtml;
}
