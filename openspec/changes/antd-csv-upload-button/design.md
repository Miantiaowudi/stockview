# CSV 上传按钮改为 Ant Design Button - Design

## 变更概述

将 `ImportTab` 组件中的 CSV 文件上传按钮从自定义 `<label>` + CSS 样式替换为 Ant Design Button 组件。

## 变更前

```tsx
<div>
  <label className="block">
    <span className="sr-only">选择CSV文件</span>
    <div className="flex items-center justify-center">
      <label
        htmlFor="file-upload"
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors duration-200"
      >
        <svg className="w-4 h-4" ... />
        <span className="text-sm font-medium">点击上传 CSV 文件</span>
      </label>
      <input id="file-upload" type="file" ref={fileInputRef} ... />
    </div>
  </label>
</div>
```

## 变更后

```tsx
<Button
  type="primary"
  onClick={() => fileInputRef.current?.click()}
  icon={
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  }
>
  上传 CSV 文件
</Button>
<input type="file" ref={fileInputRef} className="hidden" ... />
```

## 设计决策

1. **保留原生 `<input type="file">`** - 用于触发文件选择，保持无障碍性和功能
2. **使用 Button onClick 触发** - 通过 `fileInputRef.current?.click()` 触发文件选择
3. **保留上传图标** - 使用原有的 SVG 上传图标
4. **简化 DOM 结构** - 移除多层嵌套的 label 标签

## UI 对比

| 方面 | 变更前 | 变更后 |
|------|--------|--------|
| 组件来源 | 原生 HTML + Tailwind | Ant Design Button |
| DOM 嵌套 | 多层 label 嵌套 | 单层 Button |
| 无障碍 | sr-only 隐藏标签 | Button 原生支持 |
| 代码行数 | ~20 行 | ~10 行 |
