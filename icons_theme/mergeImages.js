const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function mergeImages(inputDir, outputFilePath, options = {}) {
    const {
        cols = 8,
        padding = 2,
        backgroundColor = '#ffffff',
        imageSize = null,
        excludeFiles = [],
        excludePatterns = []
    } = options;

    let files = fs.readdirSync(inputDir)
        .filter(file => ['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(file).toLowerCase()));

    if (excludeFiles.length > 0) {
        const excludeSet = new Set(excludeFiles.map(f => f.toLowerCase()));
        const beforeCount = files.length;
        files = files.filter(file => !excludeSet.has(file.toLowerCase()));
        console.log(`排除指定文件: ${beforeCount - files.length} 个`);
    }

    if (excludePatterns.length > 0) {
        const beforeCount = files.length;
        files = files.filter(file => {
            return !excludePatterns.some(pattern => {
                if (pattern.startsWith('*') && pattern.endsWith('*')) {
                    const keyword = pattern.slice(1, -1).toLowerCase();
                    return file.toLowerCase().includes(keyword);
                } else if (pattern.startsWith('*')) {
                    const suffix = pattern.slice(1).toLowerCase();
                    return file.toLowerCase().endsWith(suffix);
                } else if (pattern.endsWith('*')) {
                    const prefix = pattern.slice(0, -1).toLowerCase();
                    return file.toLowerCase().startsWith(prefix);
                } else {
                    return file.toLowerCase() === pattern.toLowerCase();
                }
            });
        });
        console.log(`排除匹配模式: ${beforeCount - files.length} 个`);
    }

    files.sort();

    if (files.length === 0) {
        console.log('未找到图片文件（可能已被全部排除）');
        return;
    }

    console.log(`✓ 找到 ${files.length} 张图片`);
    if (excludeFiles.length > 0 || excludePatterns.length > 0) {
        console.log(`  排除规则: [${[...excludeFiles, ...excludePatterns].join(', ')}]`);
    }

    const images = [];
    let maxWidth = 0;
    let maxHeight = 0;

    for (const file of files) {
        const filePath = path.join(inputDir, file);
        const metadata = await sharp(filePath).metadata();
        
        const width = imageSize || metadata.width;
        const height = imageSize || metadata.height;
        
        images.push({
            path: filePath,
            width,
            height
        });
        
        maxWidth = Math.max(maxWidth, width);
        maxHeight = Math.max(maxHeight, height);
    }

    const rows = Math.ceil(images.length / cols);
    const canvasWidth = cols * maxWidth + (cols + 1) * padding;
    const canvasHeight = rows * maxHeight + (rows + 1) * padding;

    console.log(`画布尺寸: ${canvasWidth}x${canvasHeight}`);
    console.log(`布局: ${cols}列 x ${rows}行`);

    const compositeImages = images.map((img, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const left = padding + col * (maxWidth + padding);
        const top = padding + row * (maxHeight + padding);
        
        return {
            input: img.path,
            left: Math.round(left),
            top: Math.round(top)
        };
    });

    await sharp({
        create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 4,
            background: backgroundColor
        }
    })
    .composite(compositeImages)
    .png()
    .toFile(outputFilePath);

    console.log(`✅ 合并完成！保存至: ${outputFilePath}`);
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('用法: node mergeImages.js <输入目录> <输出文件> [选项]');
    console.log('');
    console.log('参数:');
    console.log('  输入目录    包含小图的文件夹路径');
    console.log('  输出文件    合并后的大图路径 (如 output.png)');
    console.log('');
    console.log('选项:');
    console.log('  --cols <数量>          每行图片数量 (默认: 8)');
    console.log('  --padding <像素>       图片间距 (默认: 2)');
    console.log('  --bg <颜色>           背景颜色 (默认: #ffffff)');
    console.log('  --size <像素>         统一图片大小 (可选)');
    console.log('  --exclude <文件名>     排除指定文件 (可多次使用)');
    console.log('  --exclude-pattern <模式> 排除匹配的文件名模式 (支持通配符)');
    console.log('');
    console.log('示例:');
    console.log('  # 基础用法');
    console.log('  node mergeImages.js ./g output.png');
    console.log('');
    console.log('  # 排除指定文件');
    console.log('  node mergeImages.js ./g output.png --exclude s-a_101.png --exclude s-a_103.png');
    console.log('');
    console.log('  # 使用通配符排除');
    console.log('  node mergeImages.js ./g output.png --exclude-pattern "*101*" --exclude-pattern "*103*"');
    console.log('  node mergeImages.js ./g output.png --exclude-pattern "s-a_1*.png"');
    console.log('');
    console.log('  # 完整示例');
    console.log('  node mergeImages.js ./rgb merged.png --cols 10 --padding 5 --bg #000000 --exclude test.png');
    process.exit(1);
}

const inputDir = path.resolve(args[0]);
const outputFile = path.resolve(args[1]);
const options = {};

if (!fs.existsSync(inputDir)) {
    console.error(`❌ 错误: 目录不存在 - ${inputDir}`);
    process.exit(1);
}

for (let i = 2; i < args.length; i++) {
    const key = args[i];
    const value = args[i + 1];
    
    if (!value || value.startsWith('--')) {
        continue;
    }
    
    switch(key) {
        case '--cols':
            options.cols = parseInt(value);
            i++;
            break;
        case '--padding':
            options.padding = parseInt(value);
            i++;
            break;
        case '--bg':
            options.backgroundColor = value;
            i++;
            break;
        case '--size':
            options.imageSize = parseInt(value);
            i++;
            break;
        case '--exclude':
            if (!options.excludeFiles) options.excludeFiles = [];
            options.excludeFiles.push(value);
            i++;
            break;
        case '--exclude-pattern':
            if (!options.excludePatterns) options.excludePatterns = [];
            options.excludePatterns.push(value);
            i++;
            break;
    }
}

console.log(`📁 输入目录: ${inputDir}`);
console.log(`💾 输出文件: ${outputFile}`);
console.log('---');

mergeImages(inputDir, outputFile, options).catch(console.error);