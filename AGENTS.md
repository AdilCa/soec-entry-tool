# Agent.md — 架构约定与维护指南

面向维护者（人类或 AI 代理）。修改本项目前请通读本文件；多数改动只需触碰 1–2 个文件。

## 技术选型（不要打破）

- 原生 ES Modules，零依赖，无构建步骤。**不要**引入 npm / 打包器 / 框架。
- 单一数据源：`store.state`；渲染器全部无状态，只读 store、输出 HTML 字符串。
- 路径绑定：每个输入控件带 `data-path`（点号路径），通过 `getPath` / `setPath` 读写状态。
- 事件委托：所有 input / change / click 只在 `#form` 上各挂一个监听器（main.js），按 `data-*` 属性分发。**不要**给单个控件单独绑定事件。

## 模块地图

| 文件 | 职责 |
|---|---|
| `js/config.js` | **知识中心**。LABELS（中/英标签）、NUMERIC（导出转 number 的键）、MEMORY_KEYS（启用记忆候选的键）、ENUMS（硬枚举下拉）、REQUIRED_KEYS、PATTERNS（格式正则）、COND_SHORT（折叠摘要短标签）、MEMORY_IGNORE |
| `js/schema.js` | 数据结构的唯一出处：`blank*` 工厂 + `FACTORIES` 映射（`data-factory` → 工厂） |
| `js/store.js` | state / errors / collapsed 三个状态；路径读写；`allBlockPaths`（全部折叠用） |
| `js/main.js` | 入口装配；事件委托；NR/无 → 厚度联动 |
| `js/validator.js` | `validateField`（失焦）+ `validateAll`（导出前）；产出纯数据 |
| `js/exporter.js` | 数值转换、剔除 `_` 前缀键、JSON 高亮、检查清单、下载 |
| `js/memory.js` | localStorage 记忆候选；只在导出确认时 `commitFromState` |
| `js/drafts.js` | 草稿箱：输入防抖 500ms 自动存 localStorage，多草稿（上限 20），启动时若有草稿自动弹出 |
| `js/floatbar.js` | 右下角浮动按钮（回顶 / 草稿箱 / 折叠全部 / 展开全部） |
| `js/render/*` | 无状态渲染器；`index.js` 是装配入口 |
| `js/components/*` | combobox（记忆下拉）、modal（弹层），均与表单结构解耦 |

## 核心约定

### 1. 加字段的标准流程
1. `schema.js`：在对应工厂加键和默认值
2. `config.js`：LABELS 加中文标签；数值字段进 NUMERIC；需要记忆进 MEMORY_KEYS；需要短标签进 COND_SHORT
3. 对应 `render/*.js`：用 `field()` 摆进去
4. 完成。校验 / 导出 / 记忆 / 高亮全部自动生效。

### 2. 渲染积木（render/field.js）
- `field(path, key, opts)`：两行标签（中文 + JSON 键名）+ 控件。opts：`required` / `ph` / `textarea` / `full` / `disabled` / `links`
- `pairRow(base, matKey, thKey)`：材料|厚度配对，自动带 NR/无 联动
- `addBtn(path, factory, text)` / `removeBtn(path)` / `collapseBtn(path)`
- 值可能为 `undefined`（旧版导入文件缺新键），渲染器已用 `?? ""` 容错——**新增渲染代码也要保持这个容错**

### 3. NR/none 联动（main.js）
字段值一律英文：哨兵值为 `NR`（未报道）与 `none`（确认没有），枚举值也是英文（mode: galvanostatic / potentiostatic）。**不要**引入中文值。
触发条件是**两个**：锁定状态变化 `needToggle`，或锁定值本身变化 `needFill`（NR→none 时状态没变但值要跟随）。不要简化回单一条件——那会导致厚度停留在旧值。

### 4. 折叠
- `store.collapsed` 是块路径的 Set；`.collapsed` class 驱动一切
- 块内容**始终渲染**，包在 `.block-body > .body-in` 里，靠 `grid-template-rows: 1fr→0fr` 过渡动画收起——新增可折叠块必须保留这层包装
- 折叠三角是 CSS 绘制的 `.tri`（**不要用字符** ▸▾，中文字体里字形过小）
- 差异摘要：`condSummary(items, keys)` 单组全显 / 多组只显差异；构型链：`scConfig` / `symConfig`（空值、无、NR 一律省略）

### 5. 导出
- `toExport` 递归处理：NUMERIC 键可解析则转 number（NR / 空保持字符串）；`_` 前缀键剔除
- 校验有 blocking 错误时不开弹层，错误写入 `store.errors` 并派发 `form:rerender`
- 下载文件名 = DOI 清洗后 + `.json`

### 6. 记忆与草稿
- 记忆：`MEMORY_IGNORE` 的值（""、NR、none）不记录；只在 `commitFromState`（确认下载）时记录；每字段容量 50，频率排序
- 草稿：`scheduleSave` 防抖 500ms；`discardCurrent`（导出完成→删草稿）与 `detachCurrent`（清空重置→保留草稿、脱钩生成新草稿）语义不同，不要混用
- **两个函数都必须先 `clearTimeout(timer)`**——否则挂起的防抖会在删除后重建草稿（真实踩过的坑）
- 完全空白的表单不产生草稿（saveNow 里的 blank 检查）

### 7. 样式（极简风）
- 只用 tokens.css 里的变量；hairline 描边分隔层级，**不加阴影**（已评估后放弃）
- 单一 accent 绿仅用于 JSON 数字高亮；错误红 `--error`
- 必填星号 `.req` 全局红色（不要再用带作用域的选择器）
- 衬线仅用于页面大标题和材料块标题（`.block-name`）

## 已知约束

- ES Modules 要求 HTTP 环境；`file://` 直接打开会失败
- `importState` 直接接管导入的 JSON（不做深合并），缺键靠渲染层 `?? ""` 容错
- localStorage 存两类数据：记忆候选（`soec-entry-memory-v1`）、草稿（`soec-entry-drafts-v1`）
- 无自动化测试框架；改动后用本地 http.server + 浏览器手测（折叠、联动、草稿保存/恢复、导入旧 JSON、导出检查清单五个场景必测）
