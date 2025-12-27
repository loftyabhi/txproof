const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const puppeteer = require('puppeteer');

// Register helpers if needed
Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});

async function generateAdvancedPdf() {
    try {
        console.log("Reading advanced template...");
        const templateHtml = fs.readFileSync(path.join(__dirname, '../templates/advanced_bill_template.html'), 'utf8');
        const dataJson = fs.readFileSync(path.join(__dirname, '../templates/complex_sample_bill.json'), 'utf8');
        const data = JSON.parse(dataJson);

        console.log("Compiling Handlebars...");
        const template = Handlebars.compile(templateHtml);
        const html = template(data);

        console.log("Launching Puppeteer...");
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Used A4 size adjustments
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const outputName = 'advanced_bill_output.pdf';
        const pdfPath = path.join(__dirname, `../${outputName}`);

        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0px',
                right: '0px',
                bottom: '0px',
                left: '0px'
            }
        });

        await browser.close();
        console.log(`✅ Success! Advanced PDF generated: ${pdfPath}`);

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

generateAdvancedPdf();
