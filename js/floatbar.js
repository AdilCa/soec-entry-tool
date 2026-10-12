/* 右下角浮动按钮组：回到顶部 / 全部折叠 / 全部展开。
   回到顶部仅在页面滚动一段距离后浮现。 */
import { store, allBlockPaths } from "./store.js";
import { renderForm } from "./render/index.js";

export function initFloatbar() {
  const topBtn = document.getElementById("fabTop");
  const collapseAllBtn = document.getElementById("fabCollapseAll");
  const expandAllBtn = document.getElementById("fabExpandAll");

  topBtn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );

  collapseAllBtn.addEventListener("click", () => {
    allBlockPaths(store.state).forEach((p) => store.collapsed.add(p));
    renderForm();
  });

  expandAllBtn.addEventListener("click", () => {
    store.collapsed.clear();
    renderForm();
  });

  /* 回顶按钮按滚动深度显隐 */
  const onScroll = () =>
    topBtn.classList.toggle("show", window.scrollY > 400);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
