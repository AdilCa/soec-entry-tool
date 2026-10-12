# SOEC 数据库 · 文献录入工具

一个纯前端的固体氧化物电解池（SOEC）文献数据录入工具。以表格方式录入文献信息、材料与电池测试数据，导出为扁平记录格式的 JSON，用于构建可检索的文献数据库。

零依赖、无构建步骤、无后端：所有数据只存在于你的浏览器中，不会上传到任何服务器。

## 快速开始

项目使用原生 ES Modules，**必须通过 HTTP 访问**（双击 `index.html` 以 file:// 打开会被浏览器安全策略拦截）。

**推荐方式——启动脚本（Windows 双击 `start.bat`，Linux/WSL/macOS 运行 `./start.sh`）**：自动起服务、自动打开浏览器，关闭窗口即停止。端口固定 8000——草稿与记忆候选按 `localhost:端口` 存储在浏览器中，请勿随意更换端口。

也可以手动起服务，或部署到任意静态托管（GitHub Pages、Nginx、内网服务器等）：

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000
```

要求：现代浏览器（Chrome / Edge / Firefox / Safari 近年版本）。

## 录入内容

- **文献信息**：DOI、期刊、发表日期（YYYY-MM）、作者、标题、整体备注
- **材料**：样品名称（同一文献内唯一）、化学组成（多组分）、合成方法、调控方法
- **对称电池**：电解质、缓冲层 + 数据表（气氛 / 温度 / 极化电阻）
- **单电池**：阴极 / 阴极缓冲层 / 电解质 / 阳极缓冲层 / 阳极 + I–V 数据表（阴极气氛 / 阳极气氛 / 温度 / 电压 / 电流密度）+ 稳定性测试表（条件 / 模式 / 设定值 / 时长 / 衰减率）

## 快速录入

- **数据表一行一个数据点**：`Enter` 到下一行，在末行按 `Enter` 自动新增一行，并沿用上一行的气氛、温度等条件，光标直接落到第一个数值列
- `Shift+Enter` / `↑` `↓` 上下移动，`Tab` 横向移动
- **粘贴**：从 Excel、WebPlotDigitizer 复制的多行多列数据（Tab、逗号或空格分隔）直接粘贴到起始单元格，按列顺序铺开，行不够自动新增
- 新增单电池 / 对称电池时沿用上一组的结构（换材料时阴极留空）；首条稳定性测试沿用最后一行 I–V 的条件
- 值为 `NR` 的框聚焦时自动全选，直接键入即覆盖

## NR / none 语义

- `NR` = 文献未报道（not reported）；`none` = 确认没有该结构（如未使用缓冲层）

## 记忆候选

- 气氛、温度、电池材料、合成方法等字段会记住你导出过的值，下次输入时大小写不敏感子串匹配（如输入 `co` 可匹配 `1:1 CO-CO2`）
- 每条候选可单独删除；按使用频率排序，每字段最多记 50 条
- **只有点击"确认下载"的文档中的值才会被记住**——填写过程不产生记忆

## 校验与导出

- 必填项（DOI、样品名称、化学组成至少一项）：失焦标红，导出时拦截；样品名称重复也会拦截
- 格式警告（不拦截）：发表日期 YYYY-MM、数值列中的非数字
- 导出前弹出检查清单：必填完整性、NR 计数、空白计数、JSON 高亮预览
- 导出文件名自动取 DOI；数值字段自动转为 number（NR / 空白保持字符串）

## 导出格式

每个数据点一条完整记录，条件已展开，可直接合并多篇文献做筛选；记录通过 `sample_name` 关联 `materials` 中的合成方法、调控方法等信息。

```json
{
  "doi": "...", "title": "...", "journal": "...", "publication_date": "...", "authors": "...", "overall_notes": "...",
  "materials": [{ "sample_name": "SFM", "composition": ["..."], "synthesis_method": "...", "modification_method": "..." }],
  "symmetric_cell_records": [{ "sample_name": "SFM", "electrolyte": "...", "buffer_layer": "...", "atmosphere": "...", "temperature_C": 800, "polarization_resistance_Ohm_cm2": 0.08 }],
  "single_cell_records": [{ "sample_name": "SFM", "cathode": "...", "buffer_layer_cathode": "...", "electrolyte": "...", "buffer_layer_anode": "...", "anode": "...", "cathode_atmosphere": "...", "anode_atmosphere": "...", "temperature_C": 800, "voltage_V": 1.2, "current_density_A_cm2": 0.8 }],
  "stability_records": [{ "sample_name": "SFM", "...电池结构": "...", "cathode_atmosphere": "...", "anode_atmosphere": "...", "temperature_C": 800, "mode": "galvanostatic", "setpoint": "...", "duration_h": 100, "degradation_rate_per_h": 0.0012 }]
}
```

完整示例见 `example.json`。

## 浏览辅助

- 值为 `NR` 的格子灰色显示，便于扫查未填项
- 标题下方可切换数值列对齐方式：左对齐 / 右对齐 / 小数点对齐（记在浏览器中）；操作说明默认收起
- 材料、电池块可折叠（点击整条标题栏即可）；电池块标题常显构型链（如 `SFM / GDC / LSGM / LSM`，none/NR 的缓冲层自动省略）与行数
- 右下角浮动按钮：回到顶部（滚动后浮现）、草稿箱、折叠全部、展开全部

## 导入

- 支持导入本工具导出的 JSON 继续编辑（按样品名称与电池结构自动还原分组）
- 不支持旧版（嵌套结构）导出的 JSON

## 数据说明

- 表单内容通过草稿箱保护（自动保存），但草稿只是保险——完成录入后请及时导出
- localStorage 存三类数据：记忆候选（键 `soec-entry-memory-v1`）、草稿（键 `soec-entry-drafts-v2`）、显示偏好（键 `soec-entry-prefs-v1`），均不上传
- 建议建立项目根目录集中管理导出文件（如 `soec-db/entries/`，文件名即 DOI），配合 git 追踪

## 文件结构

```
├── index.html            入口
├── start.py / start.bat / start.sh   本地启动器（起服务 + 自动开浏览器）
├── css/
│   ├── tokens.css        设计变量（颜色 / 字体 / 圆角）
│   ├── base.css          基础与顶栏
│   ├── form.css          表单、数据表、块、折叠动画
│   └── components.css    下拉候选、弹层、浮动按钮、Toast
├── js/
│   ├── config.js         知识中心：标签 / 数据表列 / 数值字段 / 必填 / 枚举 / 记忆字段
│   ├── schema.js         界面状态的空白对象工厂
│   ├── records.js        界面状态 ⇄ 扁平记录（导出 / 导入）
│   ├── store.js          状态容器 + 路径读写
│   ├── main.js           入口、事件委托、表格键盘导航与粘贴
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

修改字段结构前请先阅读 `AGENTS.md`（面向开发者 / AI 代理的架构约定）。
