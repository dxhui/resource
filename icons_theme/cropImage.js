const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function trimTransparentEdges(inputBuffer) {
    const { data, info } = await sharp(inputBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    let top = height, bottom = -1, left = width, right = -1;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const alpha = data[(y * width + x) * 4 + 3];
            if (alpha > 0) {
                if (x < left) left = x;
                if (x > right) right = x;
                if (y < top) top = y;
                if (y > bottom) bottom = y;
            }
        }
    }

    console.log(`📐 边界: left=${left}, right=${right}, top=${top}, bottom=${bottom}`);
    console.log(`📐 原图: ${width}x${height} → 裁剪后: ${right-left+1}x${bottom-top+1}`);

    if (right === -1 || bottom === -1) return inputBuffer;

    return sharp(inputBuffer)
        .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
        .toBuffer();
}

async function processSingleFile(inputPath, outputPath) {
    try {
        const trimmedBuffer = await trimTransparentEdges(inputPath);
        await sharp(trimmedBuffer).toFile(outputPath);
        console.log(`✅ 处理完成: ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
    } catch (error) {
        console.error(`❌ 处理失败 ${inputPath}:`, error.message);
    }
}

async function batchProcess(inputDir) {
    const dirName = path.basename(path.normalize(inputDir));
    const parentDir = path.dirname(path.resolve(inputDir));
    const outputDir = path.join(parentDir, `trimmed_${dirName}`);
    
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const files = fs.readdirSync(inputDir)
        .filter(file => file.toLowerCase().endsWith('.png'));
    
    if (files.length === 0) {
        console.log('⚠️  未找到 PNG 文件');
        return;
    }
    
    console.log(`📁 找到 ${files.length} 个 PNG 文件 → ${path.basename(outputDir)}/\n`);
    
    for (const file of files) {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, file); // 保持原文件名
        await processSingleFile(inputPath, outputPath);
    }
    
    console.log(`\n✅ 完成！已保存到: ${outputDir}`);
}

function showHelp() {
    console.log(`
🖼️  图片透明边缘裁剪工具

用法:
  node cropImage.js <图片或目录路径>

示例:
  # 单张图片 → 生成 trimmed-xxx.png 到同目录
  node cropImage.js ./image.png

  # 目录 → 输出到 ../trimmed_xxx/ 文件夹，文件名不变
  node cropImage.js ./images/
  # 输出: ./trimmed_images/

说明:
  - 只裁剪完全透明 (alpha=0) 的边缘
  - 单张图片: 添加 "trimmed-" 前缀
  - 目录: 输出到同级 trimmed_目录，保留原文件名
`);
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }
    
    const inputPath = path.resolve(args[0]);
    
    if (!fs.existsSync(inputPath)) {
        console.error(`❌ 路径不存在: ${inputPath}`);
        process.exit(1);
    }
    
    const stats = fs.statSync(inputPath);
    
    if (stats.isFile()) {
        console.log(`📄 处理: ${path.basename(inputPath)}`);
        const output = path.join(path.dirname(inputPath), `trimmed-${path.basename(inputPath)}`);
        await processSingleFile(inputPath, output);
    } else if (stats.isDirectory()) {
        console.log(`📂 处理目录: ${path.basename(inputPath)}/`);
        await batchProcess(inputPath);
    } else {
        console.error('❌ 无效的路径');
        process.exit(1);
    }
}

main();