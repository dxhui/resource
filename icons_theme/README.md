# 🎨 图标主题处理工具集

基于 [sharp](https://github.com/lovell/sharp) 的高性能图片处理脚本集合，用于图标资源的批量处理。

## 📦 安装依赖

```bash
npm install
```

## 🛠️ 工具说明

### 1. 图片压缩工具 (compressImages.js)

**功能**: 批量压缩 PNG/JPG 图片，目标将文件大小控制在 100KB 以内

**特点**:
- ✅ 使用调色板模式压缩，保留透明通道
- ✅ 自动调整图片尺寸（默认宽度限制为 420px）
- ✅ 超强压缩算法（90%+ 压缩率）
- ✅ 支持递归处理子目录

**配置参数** (在 `config` 对象中修改):
```javascript
{
    inputDir: './theme3/r',         // 输入目录
    outputDir: './theme3/r_100k',   // 输出目录
    resizeWidth: 420,               // 目标宽度（像素）
    pngCompressionLevel: 9,        // PNG 压缩等级 (0-9)
    usePalette: true,              // 是否使用调色板
    paletteColors: 160             // 调色板颜色数量
}
```

**使用方法**:
```bash
node compressImages.js
```

**输出示例**:
```
✓ image.png: 2.50MB → 0.08MB (-96.8%)
📊 压缩完成!
   处理文件数: 50 个
   总大小变化: 125.00MB → 4.20MB
   总压缩率: 96.6%
```

---

### 2. 透明边缘裁剪工具 (cropImage.js)

**功能**: 自动检测并裁剪图片周围的完全透明区域（alpha=0）

**特点**:
- ✅ 智能识别透明边界
- ✅ 保持非透明内容完整
- ✅ 支持单张图片或整个目录处理
- ✅ 自动创建输出目录

**使用方法**:

```bash
# 处理单张图片（输出到同目录，添加 trimmed- 前缀）
node cropImage.js ./image.png

# 处理整个目录（输出到 ../trimmed_目录名/）
node cropImage.js ./images/

# 查看帮助
node cropImage.js --help
```

**输出示例**:
```
📐 边界: left=10, right=200, top=5, bottom=195
📐 原图: 256x256 → 裁剪后: 191x191
✅ 处理完成: image.png -> trimmed-image.png
```

---

### 3. 灰度转换工具 (grayscale.js)

**功能**: 将彩色图片转换为灰度图

**特点**:
- ✅ 支持多种格式（PNG、JPG、JPEG、WebP）
- ✅ 支持单文件和目录批量处理
- ✅ 可自定义输出后缀（默认 `_gray`）
- ✅ 支持排除特定文件或匹配模式
- ✅ 智能跳过已存在的文件（除非使用 `--overwrite`）

**使用方法**:

```bash
# 转换单张图片（默认输出: image_gray.png）
node grayscale.js ./image.png

# 转换整个目录
node grayscale.js ./images/

# 指定输出目录
node grayscale.js ./input/ ./output/

# 覆盖已存在的文件
node grayscale.js ./images/ --overwrite

# 自定义后缀
node grayscale.js ./images/ --suffix _bw

# 排除特定文件
node grayscale.js ./images/ --exclude logo.png icon.png

# 使用通配符排除
node grayscale.js ./images/ --exclude-patterns "*test* *temp*"
```

**支持的选项**:
- `--overwrite`: 覆盖已存在的输出文件
- `--suffix <后缀>`: 自定义输出文件后缀（默认 `_gray`）
- `--quality <质量>`: 输出质量（0-100，仅对 JPG/WebP 有效）
- `--exclude <文件列表>`: 排除指定文件（空格分隔）
- `--exclude-patterns <模式列表>`: 排除匹配模式的文件（支持通配符）

---

### 4. 图片合并工具 (mergeImages.js)

**功能**: 将多张小图合并成一张大图（生成精灵图/图集）

**特点**:
- ✅ 自定义网格布局（列数、行数自动计算）
- ✅ 可设置图片间距和背景色
- ✅ 统一图片尺寸（可选）
- ✅ 支持排除特定文件
- ✅ 自动排序确保一致性

**使用方法**:

```bash
# 基本用法（8列布局，2px间距，白色背景）
node mergeImages.js ./icons/ ./sprite.png

# 自定义列数
node mergeImages.js ./icons/ ./sprite.png --cols 10

# 设置图片尺寸（统一所有图片为 64x64）
node mergeImages.js ./icons/ ./sprite.png --size 64

# 设置间距和背景色
node mergeImages.js ./icons/ ./sprite.png --padding 4 --bg "#f0f0f0"

# 排除特定文件
node mergeImages.js ./icons/ ./sprite.png --exclude logo.png
```

**支持的选项**:
- `--cols <数字>`: 每列图片数量（默认 8）
- `--padding <像素>`: 图片间距（默认 2）
- `--bg <颜色>`: 背景颜色（默认 `#ffffff`）
- `--size <像素>`: 统一图片尺寸（宽高相同）
- `--exclude <文件列表>`: 排除指定文件
- `--exclude-patterns <模式列表>`: 排除匹配模式的文件

**输出示例**:
```
✓ 找到 50 张图片
画布尺寸: 2068x1044
布局: 8列 x 7行
✅ 合并完成！已保存到: sprite.png
```

---

## 📁 目录结构示例

```
icons_theme/
├── compressImages.js      # 图片压缩
├── cropImage.js           # 透明边缘裁剪
├── grayscale.js           # 灰度转换
├── mergeImages.js         # 图片合并
├── package.json
├── theme1/                # 示例主题目录
│   ├── g/                 # 灰度图
│   ├── rgb/               # 彩色图
│   └── trimmed_g/         # 裁剪后的灰度图
└── theme2/                # 另一个主题
    ├── g/
    └── s/
```

## 🚀 典型工作流

```bash
# 1. 安装依赖
npm install

# 2. 裁剪透明边缘
node cropImage.js ./theme3/r/

# 3. 压缩图片（减小文件体积）
# 修改 compressImages.js 中的 inputDir 为裁剪后的目录
node compressImages.js

# 4. 转换为灰度版本
node grayscale.js ./theme3/r_100k/ ./theme3/g_100k/

# 5. 合并成精灵图（可选）
node mergeImages.js ./theme3/r_100k/ ./sprite.png
```

## ⚙️ 技术规格

- **运行环境**: Node.js 12+
- **核心依赖**: sharp v0.35.3
- **支持格式**: PNG, JPG, JPEG, WebP
- **性能特点**: 基于 libvips，内存效率高，适合批量处理

## 📝 注意事项

1. **备份原始文件**: 建议在执行批量操作前备份原始图片
2. **内存占用**: 处理大量高分辨率图片时注意内存使用
3. **输出路径**: 所有工具都会自动创建不存在的输出目录
4. **错误处理**: 单个文件失败不会中断整个批处理流程
5. **透明度保留**: 压缩和裁剪操作都会保留 PNG 的 alpha 通道

## 🔧 故障排查

**问题**: 找不到 sharp 模块  
**解决**: 运行 `npm install`

**问题**: 内存不足  
**解决**: 减少批处理的文件数量，或分批次处理

**问题**: 输出文件过大  
**解决**: 
- 在 compressImages.js 中降低 `resizeWidth`
- 在 compressImages.js 中减少 `paletteColors`
- 在 grayscale.js 中降低 `--quality` 参数

## 📄 许可证

MIT License