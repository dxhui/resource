const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertToGrayscale(inputPath, outputPath, options = {}) {
    const {
        overwrite = false,
        suffix = '_gray',
        quality = 80
    } = options;

    try {
        const stats = fs.statSync(inputPath);
        
        if (stats.isDirectory()) {
            await processDirectory(inputPath, outputPath, options);
            return;
        }
        
        if (!stats.isFile()) {
            console.error(`❌ 错误: 无效的输入路径 - ${inputPath}`);
            return;
        }
        
        await processSingleFile(inputPath, outputPath, options);
    } catch (error) {
        console.error(`❌ 处理失败: ${error.message}`);
    }
}

async function processSingleFile(inputFile, outputFile, options = {}) {
    const { overwrite = false, suffix = '_gray', quality = 80 } = options;
    
    if (!fs.existsSync(inputFile)) {
        console.error(`❌ 文件不存在: ${inputFile}`);
        return;
    }
    
    const ext = path.extname(inputFile).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        console.error(`❌ 不支持的文件格式: ${ext}`);
        return;
    }
    
    let finalOutputPath = outputFile;
    if (!finalOutputPath) {
        const dir = path.dirname(inputFile);
        const baseName = path.basename(inputFile, ext);
        finalOutputPath = path.join(dir, `${baseName}${suffix}${ext}`);
    }
    
    if (fs.existsSync(finalOutputPath) && !overwrite) {
        console.log(`⚠️  跳过 (文件已存在): ${path.basename(finalOutputPath)}`);
        return;
    }
    
    const outputDir = path.dirname(finalOutputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log(`🔄 转换: ${path.basename(inputFile)} → ${path.basename(finalOutputPath)}`);
    
    await sharp(inputFile)
        .grayscale()
        .toFormat(ext.slice(1), { quality })
        .toFile(finalOutputPath);
    
    console.log(`✅ 完成: ${path.basename(finalOutputPath)}`);
}

async function processDirectory(inputDir, outputDir, options = {}) {
    const { overwrite = false, suffix = '_gray', quality = 80, excludeFiles = [], excludePatterns = [] } = options;
    
    if (!fs.existsSync(inputDir)) {
        console.error(`❌ 目录不存在: ${inputDir}`);
        return;
    }
    
    const finalOutputDir = outputDir || inputDir;
    
    if (!fs.existsSync(finalOutputDir)) {
        fs.mkdirSync(finalOutputDir, { recursive: true });
    }
    
    let files = fs.readdirSync(inputDir)
        .filter(file => ['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(file).toLowerCase()))
        .sort();
    
    if (excludeFiles.length > 0) {
        const excludeSet = new Set(excludeFiles.map(f => f.toLowerCase()));
        files = files.filter(file => !excludeSet.has(file.toLowerCase()));
    }
    
    if (excludePatterns.length > 0) {
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
    }
    
    if (files.length === 0) {
        console.log('⚠️  未找到图片文件');
        return;
    }
    
    console.log(`\n📁 处理目录: ${inputDir}`);
    console.log(`📊 找到 ${files.length} 张图片`);
    console.log(`💾 输出至: ${finalOutputDir}`);
    console.log('---');
    
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;
    
    for (const file of files) {
        const inputFilePath = path.join(inputDir, file);
        const ext = path.extname(file);
        const baseName = path.basename(file, ext);
        const outputFileName = `${baseName}${suffix}${ext}`;
        const outputFilePath = path.join(finalOutputDir, outputFileName);
        
        if (fs.existsSync(outputFilePath) && !overwrite) {
            console.log(`⚠️  跳过: ${file} (已存在)`);
            skipCount++;
            continue;
        }
        
        try {
            await sharp(inputFilePath)
                .grayscale()
                .toFormat(ext.slice(1), { quality })
                .toFile(outputFilePath);
            
            console.log(`✅ ${file} → ${outputFileName}`);
            successCount++;
        } catch (error) {
            console.error(`❌ ${file} 转换失败: ${error.message}`);
            failCount++;
        }
    }
    
    console.log('\n---');
    console.log(`📈 统计:`);
    console.log(`  ✅ 成功: ${successCount}`);
    console.log(`  ⚠️  跳过: ${skipCount}`);
    console.log(`  ❌ 失败: ${failCount}`);
    console.log(`  📊 总计: ${files.length}`);
}

const args = process.argv.slice(2);
if (args.length < 1) {
    console.log('用法: node grayscale.js <输入路径> [输出路径] [选项]');
    console.log('');
    console.log('参数:');
    console.log('  输入路径    图片文件或包含图片的目录');
    console.log('  输出路径    输出文件或目录 (可选，默认在原位置生成)');
    console.log('');
    console.log('选项:');
    console.log('  --overwrite         覆盖已存在的文件');
    console.log('  --suffix <后缀>     输出文件名后缀 (默认: _gray)');
    console.log('  --quality <质量>    JPEG/WEBP 质量 1-100 (默认: 80)');
    console.log('  --exclude <文件>     排除指定文件 (可多次使用)');
    console.log('  --exclude-pattern <模式> 排除匹配模式 (支持通配符)');
    console.log('');
    console.log('示例:');
    console.log('');
    console.log('  # 转换单个文件');
    console.log('  node grayscale.js image.png');
    console.log('  node grayscale.js image.png gray_image.png');
    console.log('');
    console.log('  # 转换整个目录');
    console.log('  node grayscale.js ./theme1/g');
    console.log('  node grayscale.js ./theme1/rgb ./output/rgb_gray');
    console.log('');
    console.log('  # 高级选项');
    console.log('  node grayscale.js ./g --overwrite --suffix _bw --quality 90');
    console.log('  node grayscale.js ./g --exclude test.png --exclude-pattern "*101*"');
    process.exit(1);
}

const inputPath = path.resolve(args[0]);
const outputPath = args[1] ? path.resolve(args[1]) : null;
const options = {};

for (let i = 2; i < args.length; i++) {
    const key = args[i];
    const value = args[i + 1];
    
    switch(key) {
        case '--overwrite':
            options.overwrite = true;
            break;
        case '--suffix':
            options.suffix = value;
            i++;
            break;
        case '--quality':
            options.quality = parseInt(value);
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

console.log('🎨 灰度转换工具');
console.log('================');
console.log(`输入: ${inputPath}`);
if (outputPath) {
    console.log(`输出: ${outputPath}`);
}
console.log('---');

convertToGrayscale(inputPath, outputPath, options);