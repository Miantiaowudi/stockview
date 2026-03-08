# 前端开发安全与架构规约 (2026 版)

> 版本: 1.0 | 更新日期: 2026-03-08

## 1. 核心安全指令 (High Priority)

### 1.1 禁止硬编码
- **严禁**在代码中生成任何真实的或模拟的 API Keys、Tokens、密码或私钥
- 必须使用环境变量 (`process.env` 或 `import.meta.env`)
- 示例:
  ```typescript
  // ❌ 禁止
  const API_KEY = 'sk-xxx'
  
  // ✅ 正确
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY
  ```

### 1.2 防御 XSS
- **除非明确要求处理富文本**，否则禁止使用：
  - `dangerouslySetInnerHTML`
  - `v-html`
  - 直接操作 `innerHTML`
- 所有用户输入必须经过转义或清理

### 1.3 依赖校验
- 推荐 npm 包时，必须确保：
  - 该包在 npmjs.com 真实存在
  - 周下载量 > 10k
  - 严防"包名钓鱼"或"幻觉依赖"

### 1.4 敏感信息脱敏
- 生成日志输出 (`console.log`) 或报错处理时，**严禁**包含用户信息：
  - 手机号
  - Email
  - 身份证号
  - 银行卡号

## 2. 技术栈约束 (Best Practices)

### 2.1 React/Next.js 规范
- 优先使用 **Server Components** 处理敏感数据获取
- **Client Components** 仅处理交互

### 2.2 状态管理
- 敏感数据（如登录态、权限信息）**不得**持久化在 LocalStorage
- 优先使用：
  - HttpOnly Cookie
  - 或加密的 SessionStorage

### 2.3 通信安全
- 所有 API 请求必须走封装好的 Axios/Fetch 拦截器
- 统一注入 Authorization Header
- 包含基础的 CSRF Token 校验逻辑

## 3. 防御性编码模式

### 3.1 可选链操作
- 处理 API 返回数据时，**强制**使用 `?.` 和 `??`
- 防止因数据结构缺失导致的页面白屏

### 3.2 表单验证
- 所有表单提交逻辑必须包含前端校验 (Zod/Yup)
- 必须提示用户后端仍需进行二次校验

### 3.3 资源加载
- 外部脚本加载必须带有 `integrity` (SRI) 属性
- 或遵循项目既定的 CSP (Content Security Policy) 策略

## 4. 安全审查提醒

在生成包含以下逻辑的代码后，必须添加安全提示：

- 权限判断
- 支付逻辑
- 敏感数据展示

请在代码末尾添加：
```
⚠️ 安全提示：请手动核验该逻辑的后端鉴权完整性。
```

---

*本规约适用于 StockView 项目所有前端代码*
