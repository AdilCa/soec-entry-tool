/* 入口：装配各模块，绑定顶栏动作与表单事件委托。 */
import { store, getPath, setPath, addAt, removeAt, resetState, importState } from "./store.js";
import { FACTORIES } from "./schema.js";
import { TABLES } from "./config.js";
import { renderForm } from "./render/index.js";
import { initCombobox } from "./components/combobox.js";
import { validateField } from "./validator.js";
import { openExportModal } from "./exporter.js";
import { isRecordsFormat, fromRecords } from "./records.js";
import { initFloatbar } from "./floatbar.js";
import { initDrafts, scheduleSave, detachCurrent } from "./drafts.js";
import { toast } from "./util.js";

const formEl = document.getElementById("form");

/* ── 输入同步：只写 state，不重渲染（重渲染会打断输入） ── */
formEl.addEventListener("input", (e) => {
  const p = e.target.dataset.path;
  if (!p) return;
  setPath(store.state, p, e.target.value);
  if (store.errors[p]) {
    delete store.errors[p];
    e.target.classList.remove("invalid");
    e.target.closest("label.f, .comp")?.querySelector(".field-error")?.remove();
  }
  scheduleSave();
});
formEl.addEventListener("change", (e) => {
  const p = e.target.dataset.path;
  if (p) setPath(store.state, p, e.target.value);
});

/* ── 聚焦值为 NR 的框时全选，直接键入即覆盖。
   鼠标点击时浏览器在 focus 之后才放置光标，故延后一拍再选 ── */
formEl.addEventListener("focusin", (e) => {
  const t = e.target;
  if (!t.matches("input[type=text]") || t.value.trim() !== "NR") return;
  setTimeout(() => {
    if (document.activeElement === t && t.value.trim() === "NR") t.select();
  });
});

/* ── 失焦校验（局部更新，不重渲染） ── */
formEl.addEventListener("focusout", (e) => {
  const p = e.target.dataset.path;
  if (!p) return;
  const msg = validateField(p, e.target.value);
  const label = e.target.closest("label.f");
  if (!label) return;
  label.querySelector(".field-error")?.remove();
  if (msg) {
    store.errors[p] = msg;
    e.target.classList.add("invalid");
    label.insertAdjacentHTML("beforeend", `<p class="field-error">${msg}</p>`);
  } else {
    delete store.errors[p];
    e.target.classList.remove("invalid");
  }
});

/* ── 数据表定位：由单元格控件反查所在表、行号、列键 ── */
function cellInfo(el) {
  const tbl = el.closest?.("table.grid");
  if (!tbl || !el.dataset.path) return null;
  const tablePath = tbl.dataset.table;
  const factory = tbl.dataset.factory;
  const row = Number(el.dataset.path.slice(tablePath.length + 1).split(".")[0]);
  return { tbl, tablePath, factory, row, key: el.dataset.key };
}

/* 新增行后的落点：条件列已沿用上一行，直接跳到第一个数值列 */
const firstFreeCol = (factory) => {
  const { cols, carry } = TABLES[factory];
  return cols.find((k) => !carry.includes(k)) ?? cols[0];
};

function appendRow(tablePath, factory) {
  const list = getPath(store.state, tablePath);
  list.push(FACTORIES[factory](list.at(-1)));
  return list.length - 1;
}

/* ── 键盘：Enter 下一行（末行则新增行），Shift+Enter 上一行，↑↓ 上下移动 ── */
formEl.addEventListener("keydown", (e) => {
  if (e.defaultPrevented || e.isComposing) return; // 记忆下拉已处理 / 输入法组字中
  const info = cellInfo(e.target);
  if (!info) return;
  const isSelect = e.target.tagName === "SELECT";
  let dir = 0;
  if (e.key === "Enter") dir = e.shiftKey ? -1 : 1;
  else if (!isSelect && e.key === "ArrowDown") dir = 1;
  else if (!isSelect && e.key === "ArrowUp") dir = -1;
  if (!dir) return;
  e.preventDefault();

  const { tablePath, factory, row, key } = info;
  const target = row + dir;
  const len = getPath(store.state, tablePath).length;
  if (target < 0) return;
  if (target >= len) {
    if (e.key !== "Enter") return;
    const ri = appendRow(tablePath, factory);
    renderForm(`${tablePath}.${ri}.${firstFreeCol(factory)}`);
    scheduleSave();
    return;
  }
  const next = formEl.querySelector(`[data-path="${tablePath}.${target}.${key}"]`);
  next?.focus();
  next?.select?.();
});

/* ── 粘贴：多行 / 多列文本（Excel、WebPlotDigitizer）从当前单元格起铺开，行不够自动新增 ── */
const NUM = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;

function parseGrid(text) {
  const lines = text.replace(/\r/g, "").replace(/\n+$/, "").split("\n");
  const hasTab = text.includes("\t");
  const rows = lines.map((l) => {
    if (hasTab) return l.split("\t").map((s) => s.trim());
    const toks = l.trim().split(/[\s,;]+/);
    return toks.every((t) => NUM.test(t)) ? toks : [l.trim()];
  });
  if (rows.length === 1 && rows[0].length === 1) return null; // 单值走浏览器默认粘贴
  return rows;
}

formEl.addEventListener("paste", (e) => {
  const info = cellInfo(e.target);
  if (!info) return;
  const grid = parseGrid(e.clipboardData.getData("text/plain"));
  if (!grid) return;
  e.preventDefault();

  const { tablePath, factory, row, key } = info;
  const { cols } = TABLES[factory];
  const c0 = cols.indexOf(key);
  const list = getPath(store.state, tablePath);
  let last = null;
  grid.forEach((vals, i) => {
    const r = row + i;
    while (list.length <= r) list.push(FACTORIES[factory](list.at(-1)));
    vals.forEach((v, j) => {
      const k = cols[c0 + j];
      if (!k) return;
      list[r][k] = v;
      last = `${tablePath}.${r}.${k}`;
    });
  });
  renderForm(last);
  scheduleSave();
  toast(`已粘贴 ${grid.length} 行`);
});

/* ── 新增项的沿用来源：同列表的上一项；首条稳定性测试沿用本电池最后一行 I–V 的条件；
   新电池取其他材料的最后一组结构（跨材料时阴极通常就是样品本身，不沿用） ── */
function prevFor(factory, list, path) {
  if (list.length) return list.at(-1);
  if (factory === "stabRow") {
    return getPath(store.state, path.replace(/\.stability$/, "")).measurements.at(-1);
  }
  const key = { sc: "single_cell", sym: "symmetric_cell" }[factory];
  if (!key) return undefined;
  const last = store.state.materials.flatMap((m) => m[key]).at(-1);
  if (!last) return undefined;
  return factory === "sc" ? { ...last, cathode: undefined } : last;
}

/* ── 结构增删 / 折叠 ── */
formEl.addEventListener("click", (e) => {
  const cbtn = e.target.closest("[data-collapse]");
  if (cbtn) {
    const path = cbtn.dataset.collapse;
    store.collapsed.has(path) ? store.collapsed.delete(path) : store.collapsed.add(path);
    renderForm();
    return;
  }

  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { path, factory } = btn.dataset;

  if (btn.dataset.action === "add") {
    const list = getPath(store.state, path);
    addAt(path, FACTORIES[factory](prevFor(factory, list, path)));
    const n = list.length - 1;
    const focus = TABLES[factory] && n > 0 ? `${path}.${n}.${firstFreeCol(factory)}` : `${path}.${n}`;
    renderForm(focus);
  } else {
    removeAt(path);
    renderForm();
  }
  scheduleSave();
});

/* ── 顶栏动作 ── */
document.getElementById("exportBtn").addEventListener("click", openExportModal);

document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("确定清空所有已填写内容？已有草稿会保留在草稿箱。")) return;
  detachCurrent();
  resetState();
  store.collapsed.clear();
  renderForm();
  toast("已重置");
});

document.getElementById("importBtn").addEventListener("click", () =>
  document.getElementById("importFile").click()
);
document.getElementById("importFile").addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const j = JSON.parse(r.result);
      if (!isRecordsFormat(j)) throw new Error("bad");
      detachCurrent(); // 导入内容另起一份草稿，不覆盖当前草稿
      importState(fromRecords(j));
      store.collapsed.clear();
      renderForm();
      scheduleSave();
      toast("导入成功");
    } catch {
      toast("文件格式不符合模板（不支持旧版嵌套格式）");
    }
    e.target.value = "";
  };
  r.readAsText(f);
});

/* exporter 校验失败/通过时要求重渲染（显示/清除错误标注） */
window.addEventListener("form:rerender", () => renderForm());

initCombobox();
initFloatbar();
initDrafts();
renderForm();
