# antd-csv-upload-button

将 `ImportTab` 组件中的 CSV 文件上传按钮从自定义 `<label>` 样式替换为 Ant Design Button 组件。

## Status
- [x] Proposal 创建
- [x] Design 创建
- [x] Tasks 创建
- [x] Implementation 完成
- [x] 验收通过

## 背景

在 `antd-button-migration` 变更中，文件上传标签被明确列为"不迁移范围"。现根据项目需要，决定将该上传按钮统一替换为 Ant Design Button 组件，以保持 UI 一致性。

## 变更内容

- `app/dashboard/import/components/ImportTab.tsx` - 上传 CSV 文件按钮

## 变更类型

**UI 组件替换** - 仅修改样式和实现方式，不改变功能行为。
