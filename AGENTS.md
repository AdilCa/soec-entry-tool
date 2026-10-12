# Agent.md — 架构约定与维护指南

面向维护者（人类或 AI 代理）。修改本项目前请通读本文件；多数改动只需触碰 1–2 个文件。

## 技术选型（不要打破）

- 原生 ES Modules，零依赖，无构建步骤。**不要**引入 npm / 打包器 / 框架。
- 单一数据源：`store.state`；渲染器全部无状态，只读 store、输出 HTML 字符串。
- 路径绑定：每个输入控件带 `data-path`（点号路径），通过 `getPath` / `setPath` 读写状态。
- 事件委托：input / change / click / keydown / paste / focusin / focusout 只在 `#form` 上各挂一个监听器（main.js），按 `data-*` 属性分发。**不要**给单个控件单独绑定事件。

## 两种数据形状

- **界面状态**（store.state、草稿）：按 材料 → 电池 → 数据行 分组，便于录入。
- **导出格式**（JSON 文件）：扁平记录，每个数据点一条完整记录，通过 `sample_name` 关联 `materials`，便于跨文献检索。
- 二者的转换只在 `records.js`：`toRecords`（导出）/ `fromRecords`（导入，按 sample_name + 电池结构重新分组）。因此 `sample_name` 在同一文献内必须唯一（validator 拦截）。

## 模块地图

| 文件 | 职责 |
|---|---|
| `js/config.js` | **知识中心**。LABELS、TABLES（数据表列顺序 + 沿用列）、SC_LAYERS / SYM_LAYERS（电池结构层）、NUMERIC、MEMORY_KEYS、ENUMS、REQUIRED_KEYS、PATTERNS、MEMORY_IGNORE |
| `js/schema.js` | 界面状态结构的唯一出处：`blank*` 工厂（接收 prev 用于沿用）+ `FACTORIES` 映射 |
| `js/records.js` | 界面状态 ⇄ 扁平记录 双向转换；`isRecordsFormat` 判定导入文件 |
| `js/store.js` | state / errors / collapsed 三个状态；路径读写；`allBlockPaths`（全部折叠用） |
| `js/main.js` | 入口装配；事件委托；表格键盘导航、粘贴铺开、新增项沿用 |
| `js/validator.js` | `validateField`（失焦）+ `validateAll`（导出前）；产出纯数据 |
| `js/exporter.js` | 转记录、数值转换、剔除 `_` 前缀键、JSON 高亮、检查清单、下载 |
| `js/memory.js` | localStorage 记忆候选；只在导出确认时 `commitFromState` |
| `js/drafts.js` | 草稿箱：输入防抖 500ms 自动存 localStorage，多草稿（上限 20），启动时若有草稿自动弹出 |
| `js/prefs.js` | 显示偏好（数值列对齐：左 / 右 / 小数点），`alignDecimals` 在每次渲染后与数值格输入时重算补位 |
| `js/floatbar.js` | 右下角浮动按钮（回顶 / 草稿箱 / 折叠全部 / 展开全部） |
| `js/render/*` | 无状态渲染器；`index.js` 是装配入口（含焦点恢复） |
| `js/components/*` | combobox（记忆下拉）、modal（弹层），均与表单结构解耦 |

## 核心约定

### 1. 加字段的标准流程
1. `schema.js`：在对应工厂加键和默认值
2. `config.js`：LABELS 加中文标签；数值字段进 NUMERIC；需要记忆进 MEMORY_KEYS；
   数据行字段加进 `TABLES[x].cols`（是条件列再加进 `carry`）；电池结构字段加进 `SC_LAYERS` / `SYM_LAYERS`
3. 非表格字段：对应 `render/*.js` 用 `field()` 摆进去（表格列由 `table()` 自动生成）
4. 完成。导出记录、导入还原、校验、记忆、高亮全部自动生效。

### 2. 渲染积木（render/field.js）
- `field(path, key, opts)`：单行中文标签（JSON 键名在悬停提示）+ 控件。opts：`required` / `ph` / `textarea` / `full`
- `table(path, factory, opts)`：数据表，一行一个数据点；opts：`minRows`（低于此数不显示行删除）/ `addText`
- `addBtn(path, factory, text)` / `removeBtn(path, text, skipTab)` / `collapseBtn(path)`
- 值可能为 `undefined`（导入文件缺键），渲染器已用 `?? ""` 容错——**新增渲染代码也要保持这个容错**

### 3. 输入与重渲染
- input 事件**只写 state，不重渲染**——整体替换 innerHTML 会销毁正在输入的控件（旧版"打第一个字光标就跳走"的根因）。
- 只有结构变化（增删、折叠、粘贴）才 `renderForm(focusPath)`；渲染后按 data-path 恢复焦点，focusPath 指向块时聚焦块内第一个控件。

### 4. 数据表交互（main.js）
- Enter 下一行，末行 Enter 新增行；Shift+Enter / ↑↓ 上下移动；Tab 横向（行删除按钮 tabindex=-1）。
- 新增行由工厂的 `prev` 参数沿用上一行的 `carry` 列，并聚焦第一个非沿用列。
- 首条稳定性测试沿用本电池最后一行 I–V 的条件；新电池沿用上一组电池结构（跨材料时不沿用阴极）。
- 粘贴：含 Tab 或多行的文本按列顺序从当前单元格铺开，行不够自动新增；单值走浏览器默认粘贴。
- 记忆下拉的 keydown 在**捕获阶段**处理并 preventDefault，表格导航检查 `defaultPrevented` 跳过；无候选时下拉隐藏、不拦截方向键。输入法组字中（isComposing）不处理。

### 5. NR / none
字段值一律英文：哨兵值为 `NR`（未报道）与 `none`（确认没有），枚举值也是英文（mode: galvanostatic / potentiostatic）。**不要**引入中文值。数值列默认预填 `NR`，聚焦时自动全选便于直接覆盖。

### 6. 折叠
- `store.collapsed` 是块路径的 Set（材料、对称电池、单电池三级）；`.collapsed` class 驱动一切
- 整条 `.block-head[data-collapse]` 都是点击区域；click 处理里先判 `[data-action]`，保证标题栏内的删除按钮不触发折叠
- 块内容**始终渲染**，包在 `.block-body > .body-in` 里，靠 `grid-template-rows: 1fr→0fr` 过渡动画收起——新增可折叠块必须保留这层包装
- 折叠三角是 CSS 绘制的 `.tri`（**不要用字符** ▸▾，中文字体里字形过小）
- 电池块标题后常显构型链 + 行数：`scConfig` / `symConfig`（空值、none、NR 一律省略）

### 7. 导出
- `toRecords` 转扁平记录 → `toExport` 递归：NUMERIC 键可解析则转 number（NR / 空保持字符串）；`_` 前缀键剔除
- 校验有 blocking 错误时不开弹层，错误写入 `store.errors` 并派发 `form:rerender`
- 数值列出现非数字（非 NR/none/空）给格式警告，不拦截
- 下载文件名 = DOI 清洗后 + `.json`

### 8. 记忆与草稿
- 记忆：`MEMORY_IGNORE` 的值（""、NR、none）不记录；只在 `commitFromState`（确认下载）时记录；每字段容量 50，频率排序
- 草稿：`scheduleSave` 防抖 500ms；`discardCurrent`（导出完成→删草稿）与 `detachCurrent`（清空重置 / 导入→保留草稿、脱钩生成新草稿）语义不同，不要混用
- **两个函数都必须先 `clearTimeout(timer)`**——否则挂起的防抖会在删除后重建草稿（真实踩过的坑）
- 完全空白的表单不产生草稿（saveNow 里的 blank 检查）

### 9. 样式（极简风）
- 只用 tokens.css 里的变量；hairline 描边分隔层级，**不加阴影**（已评估后放弃）
- 单一 accent 绿仅用于 JSON 数字高亮；错误红 `--error`
- 必填星号 `.req` 全局红色
- 衬线仅用于页面大标题和材料块标题（`.block-name`）
- 控件 class：`nr`（值为 NR，灰显；input 事件中同步切换）、`num`（NUMERIC 列，对齐方式由 `<html data-num-align>` 驱动）
- 表格列宽：`table-layout: fixed` + colgroup 百分比，权重见 config.js 的 `COL_WEIGHT`

## 已知约束

- ES Modules 要求 HTTP 环境；`file://` 直接打开会失败
- `importState` 直接接管状态（不做深合并），缺键靠渲染层 `?? ""` 容错
- 不支持导入旧版（main 分支）嵌套格式的 JSON
- localStorage 存三类数据：记忆候选（`soec-entry-memory-v1`）、草稿（`soec-entry-drafts-v2`，界面结构变更后由 v1 升级）、显示偏好（`soec-entry-prefs-v1`）
- `start.py` 发送 `Cache-Control: no-store`，避免更新代码后浏览器混用新旧 JS 模块（表现为页面只剩标题）
- 无自动化测试框架；改动后用本地 http.server + 浏览器手测（表格键盘导航与粘贴、折叠、草稿保存/恢复、导入导出往返、导出检查清单五个场景必测）
