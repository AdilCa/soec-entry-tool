/* 入口：装配各模块，绑定顶栏动作与表单事件委托。 */
import { store, getPath, setPath, addAt, removeAt, resetState, importState } from "./store.js";
import { FACTORIES } from "./schema.js";
import { renderForm } from "./render/index.js";
import { initCombobox } from "./components/combobox.js";
import { validateField } from "./validator.js";
import { openExportModal } from "./exporter.js";
import { initFloatbar } from "./floatbar.js";
import { initDrafts, scheduleSave, detachCurrent } from "./drafts.js";
import { toast } from "./util.js";

const formEl = document.getElementById("form");

/* ── 输入同步（含"材料 NR/无 → 厚度跟随锁定"联动） ── */
formEl.addEventListener("input", (e) => {
  const p = e.target.dataset.path;
  if (!p) return;
  setPath(store.state, p, e.target.value);
  delete store.errors[p];
  const errEl = e.target.closest("label.f, .row-line")?.parentElement?.querySelector(".field-error");
  if (e.target.classList.contains("invalid")) e.target.classList.remove("invalid");
  if (errEl) errEl.remove();

  /* 配对厚度联动：材料为 NR/none 时厚度跟随同值并锁定。
     注意初始材料即为 NR（厚度已锁定），因此除锁定状态变化外，
     还必须检测锁定值本身的变化（NR→none / none→NR），否则厚度停留旧值。 */
  const link = e.target.dataset.links;
  if (link) {
    const v = e.target.value.trim();
    const shouldLock = v === "NR" || v === "none";
    const thInput = formEl.querySelector(`input[data-path="${link}"]`);
    if (thInput) {
      const needFill = shouldLock && String(getPath(store.state, link) ?? "").trim() !== v;
      const needToggle = shouldLock !== thInput.disabled;
      if (needFill) setPath(store.state, link, v);
      if (needFill || needToggle) renderForm();
    }
  }
  scheduleSave();
});
formEl.addEventListener("change", (e) => {
  const p = e.target.dataset.path;
  if (p) setPath(store.state, p, e.target.value);
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

/* ── 结构增删 / 折叠 / 产率列开关 ── */
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
  const action = btn.dataset.action;

  if (action === "toggle-rates") {
    const me = getPath(store.state, btn.dataset.path);
    const on = !me._showRates;
    me._showRates = on;
    me.iv_points.forEach((pt) => {
      if (on) {
        pt.co_production_ml_min_cm2 ??= "NR";
        pt.faradaic_efficiency_percent ??= "NR";
      } else {
        delete pt.co_production_ml_min_cm2;
        delete pt.faradaic_efficiency_percent;
      }
    });
    renderForm();
    scheduleSave();
    return;
  }

  if (action === "add") {
    addAt(btn.dataset.path, FACTORIES[btn.dataset.factory]());
  } else {
    removeAt(btn.dataset.path);
  }
  renderForm();
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
      if (typeof j !== "object" || j === null || Array.isArray(j) || !Array.isArray(j.materials)) {
        throw new Error("bad");
      }
      importState(j);
      store.collapsed.clear();
      renderForm();
      scheduleSave(); // 导入内容也纳入草稿保护
      toast("导入成功");
    } catch {
      toast("文件格式不符合模板");
    }
    e.target.value = "";
  };
  r.readAsText(f);
});

/* exporter 校验失败/通过时要求重渲染（显示/清除错误标注） */
window.addEventListener("form:rerender", renderForm);

initCombobox();
initFloatbar();
initDrafts();
renderForm();
