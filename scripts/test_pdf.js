const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const puppeteer = require('puppeteer');

async function generatePdf() {
    try {
        console.log("Reading template and data...");
        const templateHtml = fs.readFileSync(path.join(__dirname, '../templates/bill_template.html'), 'utf8');
        const dataJson = fs.readFileSync(path.join(__dirname, '../templates/sample_bill.json'), 'utf8');
        const data = JSON.parse(dataJson);

        console.log("Compiling template...");
        const template = Handlebars.compile(templateHtml);
        const html = template(data);

        console.log("Launching browser...");
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        console.log("Setting content...");
        await page.setContent(html, { waitUntil: 'networkidle0' });

        console.log("Generating PDF...");
        const pdfPath = path.join(__dirname, '../sample_bill_output.pdf');
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true
        });

        await browser.close();
        console.log(`Success! PDF generated at: ${pdfPath}`);

    } catch (error) {
        console.error("Error generating PDF:", error);
    }
}

generatePdf();
