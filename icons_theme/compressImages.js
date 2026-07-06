const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const config = {
    inputDir: './theme3/r',         // 输入目录
    outputDir: './theme3/r_100k',   // 输出目录
    formats: ['.png', '.jpg', '.jpeg'],
    
    resizeWidth: 420,               // 目标100KB的尺寸
    pngCompressionLevel: 9,
    usePalette: true,
    paletteColors: 160,              // 平衡清晰度
};

async function compressImage(inputPath, outputPath) {
    const beforeSize = fs.statSync(inputPath).size;
    
    let pipeline = sharp(inputPath);
    
    if (config.resizeWidth) {
        pipeline = pipeline.resize(config.resizeWidth, null, {
            withoutEnlargement: true,
            fit: 'inside'
        });
    }
    
    const pngOptions = {
        compressionLevel: config.pngCompressionLevel,
        palette: config.usePalette,
        quality: 100,
        effort: 10,
    };
    
    if (config.usePalette) {
        await pipeline
            .ensureAlpha()
            .png({
                ...pngOptions,
                palette: true,
                colors: config.paletteColors
            })
            .toFile(outputPath);
    } else {
        await pipeline.png(pngOptions).toFile(outputPath);
    }
    
    const afterSize = fs.statSync(outputPath).size;
    const reduction = ((beforeSize - afterSize) / beforeSize * 100).toFixed(1);
    
    return { beforeSize, afterSize, reduction };
}

async function processDirectory(dir, outputBase) {
    const files = fs.readdirSync(dir);
    let totalBefore = 0;
    let totalAfter = 0;
    let count = 0;
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            const result = await processDirectory(filePath, outputBase);
            totalBefore += result.totalBefore;
            totalAfter += result.totalAfter;
            count += result.count;
        } else {
            const ext = path.extname(file).toLowerCase();
            if (config.formats.includes(ext)) {
                const relativePath = path.relative(config.inputDir, filePath);
                const outputPath = path.join(outputBase, relativePath);
                
                fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                
                try {
                    const result = await compressImage(filePath, outputPath);
                    console.log(`✓ ${relativePath}: ${(result.beforeSize / 1024 / 1024).toFixed(2)}MB → ${(result.afterSize / 1024 / 1024).toFixed(2)}MB (-${result.reduction}%)`);
                    totalBefore += result.beforeSize;
                    totalAfter += result.afterSize;
                    count++;
                } catch (err) {
                    console.error(`✗ ${relativePath}: ${err.message}`);
                }
            }
        }
    }
    
    return { totalBefore, totalAfter, count };
}

async function main() {
    console.log('🔥 超强PNG压缩模式启动！（保留透明度）');
    console.log(`📁 输入目录: ${config.inputDir}`);
    console.log(`📁 输出目录: ${config.outputDir}`);
    console.log('\n⚙️  超强压缩参数:');
    console.log(`   • 尺寸限制: ${config.resizeWidth ? config.resizeWidth + 'px宽' : '不改变'}`);
    console.log(`   • PNG压缩: 等级${config.pngCompressionLevel}/9`);
    console.log(`   • 调色板: ${config.usePalette ? `开启 (${config.paletteColors}色)` : '关闭'}`);
    console.log('\n💡 目标: 500KB → 50KB以内 (90%+压缩率)\n');
    console.log('-'.repeat(60));
    
    const startTime = Date.now();
    const result = await processDirectory(config.inputDir, config.outputDir);
    const endTime = Date.now();
    
    console.log('-'.repeat(60));
    console.log('\n📊 压缩完成!');
    console.log(`   处理文件数: ${result.count} 个`);
    console.log(`   总大小变化: ${(result.totalBefore / 1024 / 1024).toFixed(2)}MB → ${(result.totalAfter / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   总压缩率: ${((result.totalBefore - result.totalAfter) / result.totalBefore * 100).toFixed(1)}%`);
    console.log(`   节省空间: ${((result.totalBefore - result.totalAfter) / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   用时: ${(endTime - startTime) / 1000} 秒`);
}

main().catch(console.error);