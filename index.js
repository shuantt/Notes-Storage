const express = require('express');
const MarkdownIt = require('markdown-it'); 
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const app = express();
const PORT = 3000;

// 設置靜態文件目錄
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/css', express.static(path.join(__dirname, 'css'))); 

// 儲存分類信息
const categories = {};

// 讀取 Markdown 檔案並解析 YAML 頭部
function parseMarkdownFile(filename) {
    const filePath = path.join(__dirname, 'docs', filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // 提取 YAML 頭部
    const parts = fileContent.split('---').filter(Boolean);
    const header = parts[0].trim();
    const markdownContent = parts.slice(1).join('---').trim();

    const data = yaml.load(header);
    return { ...data, markdown: markdownContent };
}

// 初始化 Markdown 渲染器
const md = new MarkdownIt();

// 初始化分類資料
function initializeCategories() {
    const files = fs.readdirSync(path.join(__dirname, 'docs'));
    
    files.forEach(file => {
        const { category } = parseMarkdownFile(file);
        if (category) {
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(file.replace('.md', ''));
        }
    });
}

// 調用初始化函數
initializeCategories();

// 渲染 Markdown 檔案的路由
app.get('/docs/:filename', (req, res) => {
    const { title, category, markdown } = parseMarkdownFile(`${req.params.filename}.md`);
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <link rel="stylesheet" href="/css/style.css"> 
        </head>
        <body>
            <div class="container">
                <h1>${title}</h1>
                <div>${md.render(markdown)}</div>
            </div>
        </body>
        </html>
    `;
    res.send(htmlContent);
});

// 獲取分類列表
app.get('/categories', (req, res) => {
    const files = fs.readdirSync(path.join(__dirname, 'docs'));
    
    files.forEach(file => {
        const { category } = parseMarkdownFile(file);
        if (category) {
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(file.replace('.md', ''));
        }
    });
    
    const categoryLinks = Object.keys(categories)
        .map(cat => `<li><a href="/category/${cat}">${cat}</a></li>`)
        .join('');
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>分類</title>
            <link rel="stylesheet" href="/css/style.css"> 
        </head>
        <body>
            <div class="container">
                <h1>分類列表</h1>
                <ul>
                    ${categoryLinks}
                </ul>
            </div>
        </body>
        </html>
    `;
    
    res.send(htmlContent);
});

// 根據分類名稱獲取文件
app.get('/category/:categoryName', (req, res) => {
    const categoryName = req.params.categoryName;
    const files = categories[categoryName] || [];
    
    const fileLinks = files
        .map(file => `<li><a href="/docs/${file}">${file}</a></li>`)
        .join('');
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${categoryName} 的筆記</title>
            <link rel="stylesheet" href="/css/style.css"> 
        </head>
        <body>
            <div class="container">
                <h1>${categoryName} 的筆記</h1>
                <ul>
                    ${fileLinks}
                </ul>
            </div>
        </body>
        </html>
    `;
    
    res.send(htmlContent);
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`伺服器在 http://localhost:${PORT} 上運行`);
});
