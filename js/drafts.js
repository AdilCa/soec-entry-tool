/* 草稿箱：输入防抖 500ms 自动保存到 localStorage，支持多草稿并存。
   草稿以 DOI > 标题 > 样品名 命名；导出确认 / 清空重置后丢弃当前草稿；
   启动时若有草稿自动弹出草稿箱。 */
import { store, importState } from "./store.js";
import { renderForm } from "./render/index.js";
import { openModal, closeModal } from "./components/modal.js";
import { esc, toast } from "./util.js";

/* v2：界面状态改为表格化结构，v1 草稿与之不兼容 */
const LS_KEY = "soec-entry-drafts-v2";
const CAP = 20;

let currentId = null; // 当前表单对应的草稿 id
let timer = null;

const loadAll = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch {
    return {};
  }
};
const saveAll = (d) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(d));
  } catch {
    /* 存储满或禁用时静默失败 */
  }
};

export const hasDrafts = () => Object.keys(loadAll()).length > 0;

/* 输入/结构变化后调用，防抖合并 */
export function scheduleSave() {
  clearTimeout(timer);
  timer = setTimeout(saveNow, 500);
}

function saveNow() {
  const s = store.state;
  /* 完全空白的表单不产生草稿 */
  const blank =
    !s.doi.trim() &&
    !s.title.trim() &&
    !s.materials.some((m) => m.sample_name.trim());
  if (blank) return;

  if (!currentId) currentId = "d" + Date.now();
  const all = loadAll();
  all[currentId] = {
    t: Date.now(),
    name:
      s.doi.trim() ||
      s.title.trim() ||
      s.materials.map((m) => m.sample_name.trim()).filter(Boolean).join(", ") ||
      "未命名草稿",
    data: JSON.parse(JSON.stringify(s)),
  };
  /* 容量淘汰：最旧的先删，永不删当前草稿 */
  Object.keys(all)
    .sort((a, b) => all[b].t - all[a].t)
    .slice(CAP)
    .forEach((id) => {
      if (id !== currentId) delete all[id];
    });
  saveAll(all);
}

/* 导出确认后调用：条目已完成，草稿删除。
   注意必须清掉挂起的防抖定时器，否则稍后的 saveNow 会把刚删的草稿重建 */
export function discardCurrent() {
  clearTimeout(timer);
  if (!currentId) return;
  const all = loadAll();
  delete all[currentId];
  saveAll(all);
  currentId = null;
}

/* 清空重置时调用：草稿保留在草稿箱（可恢复/手动删除），
   当前表单与草稿脱钩，下次输入会生成新草稿——这是多草稿并存的入口 */
export function detachCurrent() {
  clearTimeout(timer);
  currentId = null;
}

const fmt = (t) => {
  const d = new Date(t);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function openDrafts() {
  const all = loadAll();
  const ids = Object.keys(all).sort((a, b) => all[b].t - all[a].t);
  const body = ids.length
    ? `<p class="check-note">输入时自动保存，最多保留 ${CAP} 份；导出下载后对应草稿自动清除。</p>
       <div class="draft-list">${ids
         .map(
           (id) => `
        <div class="draft-item">
          <span class="v">${esc(all[id].name)}</span>
          <span class="t">${fmt(all[id].t)}</span>
          <button class="add" data-restore="${id}">恢复</button>
          <button class="remove" data-del="${id}">删除</button>
        </div>`
         )
         .join("")}</div>`
    : `<p class="empty-hint">暂无草稿，开始填写后自动保存</p>`;

  openModal({ title: "草稿箱", body, actions: [] });

  document.querySelectorAll("[data-restore]").forEach((b) =>
    b.addEventListener("click", () => {
      const d = loadAll()[b.dataset.restore];
      if (!d) return;
      importState(d.data);
      currentId = b.dataset.restore;
      store.collapsed.clear();
      renderForm();
      closeModal();
      toast("已恢复草稿");
    })
  );
  document.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => {
      const all2 = loadAll();
      delete all2[b.dataset.del];
      if (b.dataset.del === currentId) currentId = null;
      saveAll(all2);
      openDrafts(); // 重绘列表
    })
  );
}

export function initDrafts() {
  document.getElementById("fabDrafts").addEventListener("click", openDrafts);
  if (hasDrafts()) openDrafts();
}
