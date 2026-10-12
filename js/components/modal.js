/* 通用弹层：标题 + 内容 HTML + 底部按钮。导出预览复用。 */
let el = null;

export function openModal({ title, body, actions }) {
  closeModal();
  el = document.createElement("div");
  el.className = "modal-backdrop";
  el.innerHTML = `
    <div class="modal" role="dialog" aria-label="${title}">
      <div class="modal-head">
        <h2>${title}</h2>
        <button class="modal-close" data-close aria-label="关闭">×</button>
      </div>
      <div class="modal-body">${body}</div>
      <div class="modal-foot"></div>
    </div>`;

  const foot = el.querySelector(".modal-foot");
  actions.forEach((a) => {
    const b = document.createElement("button");
    b.className = a.primary ? "btn" : "btn-ghost";
    b.textContent = a.text;
    b.addEventListener("click", () => a.onClick(closeModal));
    foot.appendChild(b);
  });

  el.addEventListener("mousedown", (e) => {
    if (e.target === el || e.target.closest("[data-close]")) closeModal();
  });
  document.addEventListener("keydown", onEsc);
  document.getElementById("modalRoot").appendChild(el);
}

function onEsc(e) {
  if (e.key === "Escape") closeModal();
}

export function closeModal() {
  if (el) {
    document.removeEventListener("keydown", onEsc);
    el.remove();
    el = null;
  }
}
