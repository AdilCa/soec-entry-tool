/* 记忆候选下拉：大小写不敏感子串匹配、键盘导航、单条删除。
   通过事件委托工作，不依赖具体表单结构；只读 memory.js 接口。 */
import * as memory from "../memory.js";
import { esc } from "../util.js";
import { MEMORY_IGNORE } from "../config.js";

let dd = null;        // 下拉元素
let input = null;     // 当前关联的输入框
let items = [];       // 当前过滤后的候选
let activeIdx = -1;

export function initCombobox() {
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("focusout", onFocusOut);
  document.addEventListener("input", onInput);
  /* 捕获阶段：先于表单的表格键盘导航处理，已处理的键 preventDefault 后表单跳过 */
  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("mousedown", onMouseDown);
  window.addEventListener("scroll", close, true);
  window.addEventListener("resize", close);
}

function onFocusIn(e) {
  if (e.target.matches("input[data-memory]")) open(e.target);
}

function onFocusOut(e) {
  if (e.target === input) close(); // mousedown 已在更早阶段处理选择/删除
}

function onInput(e) {
  if (e.target === input) refresh();
}

function onKeyDown(e) {
  if (!dd || e.target !== input) return;
  if ((e.key === "ArrowDown" || e.key === "ArrowUp") && items.length) {
    e.preventDefault();
    const dir = e.key === "ArrowDown" ? 1 : -1;
    activeIdx = (activeIdx + dir + items.length) % items.length;
    paint();
  } else if (e.key === "Enter" && activeIdx >= 0) {
    e.preventDefault();
    pick(items[activeIdx]);
  } else if (e.key === "Escape") {
    close();
  }
}

/* mousedown 先于 blur 触发，在这里完成选择与删除 */
function onMouseDown(e) {
  if (!dd) return;
  const x = e.target.closest(".combo-item .x");
  const item = e.target.closest(".combo-item");
  if (x && item) {
    e.preventDefault();
    memory.remove(input.dataset.memory, item.dataset.v);
    refresh();
    input.focus();
    return;
  }
  if (item) {
    e.preventDefault();
    pick(item.dataset.v);
    return;
  }
  if (!dd.contains(e.target) && e.target !== input) close();
}

function open(el) {
  input = el;
  if (!dd) {
    dd = document.createElement("div");
    dd.className = "combo-dd";
    document.body.appendChild(dd);
  }
  refresh();
}

function refresh() {
  const key = input.dataset.memory;
  /* 框里是 NR / none 等占位值时视为未输入，展示全部候选 */
  const raw = input.value.trim();
  const q = MEMORY_IGNORE.has(raw) ? "" : raw.toLowerCase();
  items = memory.list(key).filter((v) => !q || v.toLowerCase().includes(q));
  activeIdx = -1;
  paint();
  position();
}

function paint() {
  if (!dd) return;
  /* 无候选时不显示：表格里空下拉会遮住下一行单元格 */
  dd.hidden = !items.length;
  dd.innerHTML = items.map((v, i) => `
      <div class="combo-item${i === activeIdx ? " active" : ""}" data-v="${esc(v)}">
        <span class="v">${esc(v)}</span>
        <button class="x" title="删除此条记忆" tabindex="-1">×</button>
      </div>`).join("");
  if (activeIdx >= 0 && dd.children[activeIdx]) {
    dd.children[activeIdx].scrollIntoView({ block: "nearest" });
  }
}

function position() {
  const r = input.getBoundingClientRect();
  dd.style.left = r.left + "px";
  dd.style.top = r.bottom + 4 + "px";
  dd.style.width = Math.max(r.width, 200) + "px";
}

function pick(v) {
  input.value = v;
  /* 触发 input 事件让 store 同步 */
  input.dispatchEvent(new Event("input", { bubbles: true }));
  close();
  input.focus();
}

function close() {
  if (dd) {
    dd.remove();
    dd = null;
  }
  input = null;
  items = [];
  activeIdx = -1;
}
