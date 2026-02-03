const fs = require('fs');
const path = require('path');

const src = path.join(process.cwd(), 'src/services/email/templates');
const dist = path.join(process.cwd(), 'dist/services/email/templates');

console.log('🚀 Starting postbuild: Copying email templates...');
console.log(`📂 Source: ${src}`);
console.log(`📂 Destination: ${dist}`);

if (fs.existsSync(src)) {
    if (!fs.existsSync(dist)) {
        console.log('📁 Creating destination directory...');
        fs.mkdirSync(dist, { recursive: true });
    }

    const files = fs.readdirSync(src);
    console.log(`📄 Found ${files.length} files to copy.`);

    files.forEach(file => {
        const srcFile = path.join(src, file);
        const distFile = path.join(dist, file);
        console.log(`  - Copying: ${file}`);
        fs.copyFileSync(srcFile, distFile);
    });

    console.log('✅ Postbuild completed successfully.');
} else {
    console.log('⚠️ Source directory not found. Skipping template copy.');
}
