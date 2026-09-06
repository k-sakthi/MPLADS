const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function findAndReplace(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            findAndReplace(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            // Replaces for 'http://localhost:8000/...'
            content = content.replace(/'http:\/\/localhost:8000(.*?)'/g, '`${API_URL}$1`');
            content = content.replace(/'http:\/\/127\.0\.0\.1:8000(.*?)'/g, '`${API_URL}$1`');
            
            // Replaces for "http://localhost:8000/..."
            content = content.replace(/"http:\/\/localhost:8000(.*?)"/g, '`${API_URL}$1`');
            content = content.replace(/"http:\/\/127\.0\.0\.1:8000(.*?)"/g, '`${API_URL}$1`');
            
            // Replaces for `http://localhost:8000/...`
            content = content.replace(/`http:\/\/localhost:8000(.*?)`/g, '`${API_URL}$1`');
            content = content.replace(/`http:\/\/127\.0\.0\.1:8000(.*?)`/g, '`${API_URL}$1`');

            if (content !== originalContent) {
                // Add import if not present
                if (!content.includes("import { API_URL } from '@/lib/api'")) {
                    // Try to insert after the last import, or at the top
                    const importStatement = `import { API_URL } from '@/lib/api';\n`;
                    
                    // Simple logic: insert at the very top, unless there's a "use client" directive
                    if (content.startsWith('"use client"') || content.startsWith("'use client'")) {
                        const lines = content.split('\n');
                        lines.splice(1, 0, importStatement);
                        content = lines.join('\n');
                    } else {
                        content = importStatement + content;
                    }
                }
                
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

findAndReplace(srcDir);
