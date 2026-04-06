# CSV 上传按钮改为 Ant Design Button - Proposal

## 摘要

将 `ImportTab` 组件中的 CSV 文件上传按钮替换为 Ant Design Button 组件，保持与项目其他按钮的 UI 一致性。

## 现状分析

当前 `ImportTab` 组件使用自定义 `<label>` 标签实现上传按钮：

```tsx
<label
  htmlFor="file-upload"
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors duration-200"
>
  <svg className="w-4 h-4" ... />
  <span className="text-sm font-medium">点击上传 CSV 文件</span>
</label>
<input id="file-upload" type="file" ... />
```

### 问题

1. **UI 不一致** - 项目其他按钮已迁移为 Ant Design Button，唯独此按钮仍使用自定义样式
2. **DOM 结构冗余** - 多层嵌套的 label 标签
3. **维护成本** - 自定义样式需要手动维护

## 解决方案

使用 Ant Design Button 组件替代：

```tsx
<Button
  type="primary"
  onClick={() => fileInputRef.current?.click()}
  icon={<UploadIcon />}
>
  上传 CSV 文件
</Button>
<input type="file" ref={fileInputRef} className="hidden" ... />
```

## 影响范围

- 仅影响 `ImportTab` 组件的上传按钮
- 不影响文件上传功能逻辑
- 不影响其他组件

## 风险评估

- **风险等级**: 低
- **回滚方案**: 保留原代码，恢复即可
