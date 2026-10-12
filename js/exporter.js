/* 导出：转扁平记录、数值转换、JSON 高亮、检查清单渲染、下载/复制。 */
import { NUMERIC } from "./config.js";
import { store } from "./store.js";
import { esc, toast } from "./util.js";
import { validateAll, describePath } from "./validator.js";
import { toRecords } from "./records.js";
import { commitFromState } from "./memory.js";
import { discardCurrent } from "./drafts.js";
import { openModal } from "./components/modal.js";

/* ── 数值转换：NR/空值保持字符串，可解析的转 number ── */
function toExport(node, key) {
  if (Array.isArray(node)) return node.map((v) => toExport(v, null));
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith("_")) continue; // 界面内部状态不导出
      out[k] = toExport(v, k);
    }
    return out;
  }
  if (key && NUMERIC.has(key) && typeof node === "string") {
    const t = node.trim();
    if (t !== "" && t !== "NR" && !isNaN(Number(t))) return Number(t);
  }
  return node;
}

export const exportJSON = () => JSON.stringify(toExport(toRecords(store.state)), null, 2);

/* ── 高亮：NR 单独着色（灰斜体），便于导出前扫查。
   在原始文本上匹配、分段转义，避免引号被转义后字符串匹配失败。 ── */
function highlight(json) {
  const re = /("(?:\\.|[^"\\])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
  let out = "", last = 0, m;
  while ((m = re.exec(json))) {
    out += esc(json.slice(last, m.index));
    const tok = m[0];
    let cls = "num";
    if (tok.startsWith('"')) {
      if (m[2]) cls = "key";
      else cls = tok === '"NR"' ? "nr" : "str";
    } else if (/^(true|false|null)$/.test(tok)) cls = "bool";
    out += `<span class="${cls}">${esc(tok)}</span>`;
    last = re.lastIndex;
  }
  return out + esc(json.slice(last));
}

/* ── 检查清单 ── */
function checklistHTML(result) {
  const missing = Object.entries(result.errors).map(
    ([p, msg]) => `${describePath(p)}：${msg}`
  );
  const rows = [];
  if (missing.length) {
    rows.push(`<div class="check-item bad"><span class="k">缺失必填</span><span class="v">${missing.map(esc).join("；")}</span></div>`);
  } else {
    rows.push(`<div class="check-item ok"><span class="k">必填项</span><span class="v">完整 ✓</span></div>`);
  }
  result.warnings.forEach((w) =>
    rows.push(`<div class="check-item bad"><span class="k">格式警告</span><span class="v">${esc(w)}</span></div>`)
  );
  rows.push(`<div class="check-item ok"><span class="k">NR（未报道）</span><span class="v">${result.nrCount} 项</span></div>`);
  rows.push(`<div class="check-item ok"><span class="k">空白（未填写）</span><span class="v">${result.emptyCount} 项</span></div>`);
  return `<div class="check-list">${rows.join("")}</div>
    <p class="check-note">请确认以上 NR 与空白均为有意为之，然后下载。</p>`;
}

/* ── 导出弹层 ── */
export function openExportModal() {
  const result = validateAll(store.state);
  if (result.blocking) {
    store.errors = result.errors;
    window.dispatchEvent(new CustomEvent("form:rerender"));
    toast("必填项缺失或有误，已标红");
    return;
  }
  store.errors = {};
  window.dispatchEvent(new CustomEvent("form:rerender"));

  const json = exportJSON();
  openModal({
    title: "导出预览",
    body: checklistHTML(result) + `<div class="json-box"><pre class="mono">${highlight(json)}</pre></div>`,
    actions: [
      {
        text: "复制到剪贴板",
        onClick: async () => {
          await navigator.clipboard.writeText(json);
          toast("已复制到剪贴板");
        },
      },
      {
        text: "确认下载",
        primary: true,
        onClick: (close) => {
          commitFromState(store.state); // 只有进入正式文档的值才记入候选
          discardCurrent(); // 已导出，对应草稿清除
          const blob = new Blob([json], { type: "application/json" });
          const a = document.createElement("a");
          const name = store.state.doi.trim().replace(/[^\w.-]+/g, "_") || "entry";
          a.href = URL.createObjectURL(blob);
          a.download = name + ".json";
          a.click();
          URL.revokeObjectURL(a.href);
          close();
          toast("已下载 " + name + ".json");
        },
      },
    ],
  });
}
