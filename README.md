# SOEC 数据库 · 文献录入工具

一个纯前端的固体氧化物电解池（SOEC）文献数据录入工具。按结构化模板填写文献信息、材料与电池测试数据，导出为规范 JSON，用于构建可检索的文献数据库。

零依赖、无构建步骤、无后端：所有数据只存在于你的浏览器中，不会上传到任何服务器。

## 快速开始

项目使用原生 ES Modules，**必须通过 HTTP 访问**（双击 `index.html` 以 file:// 打开会被浏览器安全策略拦截）。

**推荐方式——启动脚本（Windows 双击 `start.bat`，Linux/WSL/macOS 运行 `./start.sh`）**：自动起服务、自动打开浏览器，关闭窗口即停止。端口固定 8000——草稿与记忆候选按 `localhost:端口` 存储在浏览器中，请勿随意更换端口。

也可以手动起服务，或部署到任意静态托管（GitHub Pages、Nginx、内网服务器等），无需任何服务端组件：

```bash
cd app
python3 -m http.server 8000
# 打开 http://localhost:8000
```

要求：现代浏览器（Chrome / Edge / Firefox / Safari 近年版本）。

## 功能

### 结构化录入
- **文献信息**：DOI、期刊、标题、发表日期（YYYY-MM）、作者、整体备注
- **材料**：样品名称、化学组成（多组分）、合成方法、调控方法
- **对称电池**：电解质、缓冲层、电极厚度 + 测量数据（气氛 / 温度 / 极化电阻 / 测试电位）
- **单电池**：集流体、电极面积、阴极 / 缓冲层 / 电解质 / 阳极（材料与厚度成对）+ 测量数据（含 I–V 数据对，可挂载 CO 产率 / 法拉第效率列）+ 稳定性测试

### NR / 无 语义
- `NR` = 文献未报道（not reported）；`无` = 确认没有该结构（如未使用缓冲层）
- 材料字段填 `NR` 或 `无` 时，配对的厚度字段自动跟随同值并锁定；材料改回具体值后厚度解锁可编辑

### 记忆候选
- 气氛、流量、温度、材料、合成方法等字段会记住你导出过的值，下次输入时大小写不敏感子串匹配（如输入 `co` 可匹配 `1:1 CO-CO2`）
- 每条候选可单独删除；按使用频率排序，每字段最多记 50 条
- **只有点击"确认下载"的文档中的值才会被记住**——填写过程不产生记忆

### 校验与导出
- 必填项（DOI、样品名称、化学组成至少一项）：失焦标红，导出时拦截
- 格式校验：DOI 格式、发表日期 YYYY-MM（警告不拦截）
- 导出前弹出检查清单：必填完整性、NR 计数、空白计数、JSON 高亮预览（NR 灰斜体单独着色，方便扫查遗漏）
- 导出文件名自动取 DOI；数值字段自动转为 number（NR / 空白保持字符串）

### 浏览辅助
- 所有块可折叠；多条测量并列时，折叠摘要只显示兄弟块之间**有差异**的条件字段
- 电池块折叠后显示构型链（如 `SFM / GDC / LSGM / GDC / SFM`，none/NR 的缓冲层自动省略）
- 右下角浮动按钮：回到顶部（滚动后浮现）、草稿箱、折叠全部、展开全部

### 导入
- 支持导入此前导出的 JSON 继续编辑；旧版本导出的文件缺少新增字段时按空白处理，不会报错

## 数据说明

- 表单内容通过草稿箱保护（自动保存），但草稿只是保险——完成录入后请及时导出
- localStorage 存两类数据：记忆候选（键 `soec-entry-memory-v1`）与草稿（键 `soec-entry-drafts-v1`），均不上传
- 导出 JSON 中以 `_` 开头的界面内部状态键（如 `_showRates`）会被自动剔除
- I–V 数据对若从未添加产率 / 效率列，对应键在 JSON 中整体省略而非置空
- 建议建立项目根目录集中管理导出文件（如 `soec-db/entries/`，文件名即 DOI），配合 git 追踪

## 文件结构

```
app/
├── index.html            入口
├── start.py / start.bat / start.sh   本地启动器（起服务 + 自动开浏览器）
├── css/
│   ├── tokens.css        设计变量（颜色 / 字体 / 圆角）
│   ├── base.css          基础与顶栏
│   ├── form.css          表单、块、折叠动画
│   └── components.css    下拉候选、弹层、浮动按钮、Toast
├── js/
│   ├── config.js         知识中心：标签 / 数值字段 / 必填 / 枚举 / 记忆字段
│   ├── schema.js         空白对象工厂（数据结构唯一出处）
│   ├── store.js          状态容器 + 路径读写
│   ├── main.js           入口、事件委托、NR/无 联动
│   ├── validator.js      校验
│   ├── exporter.js       导出、检查清单、JSON 高亮
│   ├── memory.js         记忆候选（localStorage）
│   ├── drafts.js         草稿箱（localStorage 自动保存）
│   ├── floatbar.js       浮动按钮组
│   ├── util.js           转义、Toast
│   ├── components/       combobox（记忆下拉）、modal（弹层）
│   └── render/           无状态渲染器（meta / material / symmetric / singleCell / field / summary）
└── example.json          填好的示例数据，可用于测试导入功能
```

## 维护

修改字段结构前请先阅读 `Agent.md`（面向开发者 / AI 代理的架构约定）。
 floatbar.js       浮动按钮组
│   ├── util.js           转义、Toast
│   ├── components/       combobox（记忆下拉）、modal（弹层）
│   └── render/           无状态渲染器（meta / material / symmetric / singleCell / field / summary）
└── example.json          填好的示例数据，可用于测试导入功能
```

## 维护

修改字段结构前请先阅读 `Agent.md`（面向开发者 / AI 代理的架构约定）。
