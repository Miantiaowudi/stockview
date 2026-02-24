# UI/UX Pro Max Skill

An AI skill that provides design intelligence for building professional UI/UX across multiple platforms.

## 安装完成

✅ UI/UX Pro Max Skill 已成功添加到您的项目中！

## 目录结构

```
.opencode/skills/ui-ux-pro-max/
├── skill.yaml              # Skill 配置文件
├── data/                   # 设计数据库
│   ├── styles.csv         # 67 种 UI 风格
│   ├── colors.csv         # 96 种配色方案
│   ├── typography.csv     # 57 种字体组合
│   └── products.csv       # 产品类型匹配
├── scripts/               # Python 脚本
│   ├── search.py          # 主搜索脚本
│   ├── core.py            # BM25 搜索引擎
│   └── design_system.py   # 设计系统生成器
└── stacks/                # 技术栈规范 (待添加)
```

## 使用方法

### 1. 搜索设计资源

```bash
# 搜索配色方案
python .opencode/skills/ui-ux-pro-max/scripts/search.py "saas" --domain color

# 搜索 UI 风格
python .opencode/skills/ui-ux-pro-max/scripts/search.py "minimalism" --domain style

# 搜索字体组合
python .opencode/skills/ui-ux-pro-max/scripts/search.py "modern" --domain typography

# 搜索产品类型
python .opencode/skills/ui-ux-pro-max/scripts/search.py "dashboard" --domain product
```

### 2. 生成设计系统

```bash
# 生成完整的设计系统推荐
python .opencode/skills/ui-ux-pro-max/scripts/search.py "SaaS dashboard" --design-system -p "MyProject"

# 生成 Markdown 格式
python .opencode/skills/ui-ux-pro-max/scripts/search.py "e-commerce" --design-system -f markdown -p "ShopApp"
```

### 3. 在 AI 对话中使用

当您在 OpenCode 中请求 UI/UX 相关工作时，此 Skill 会自动激活并提供建议：

- "帮我设计一个 SaaS 产品的界面"
- "推荐一个适合金融应用的配色方案"
- "给我一些现代化的 UI 风格建议"

## 功能特性

- **67 种 UI 风格**：Minimalism、Glassmorphism、Neumorphism、Brutalism 等
- **96 种配色方案**：针对 SaaS、电商、金融、医疗等不同行业
- **57 种字体组合**：Google Fonts 集成，Tailwind 配置
- **BM25 搜索引擎**：智能匹配最相关的设计资源
- **设计系统生成器**：一键生成完整的设计规范

## 可用领域 (Domains)

| 领域 | 描述 |
|------|------|
| `style` | UI 风格、设计趋势 |
| `color` | 配色方案、色彩心理学 |
| `typography` | 字体组合、排版 |
| `product` | 产品类型推荐 |
| `landing` | 落地页模式 |
| `ux` | UX 最佳实践 |
| `chart` | 图表类型推荐 |
| `icons` | 图标库推荐 |

## 数据来源

本 Skill 基于 [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) 开源项目。

---

*安装时间: 2026年2月13日*
