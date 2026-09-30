import { formatRand } from "../data/economy.js";

export function createMoneyQueue({
  present = () => {},
  settle = () => {},
  announce = () => {},
  scheduler = (callback, delay) => setTimeout(callback, delay),
  cancel = (timer) => clearTimeout(timer),
  duration = 850,
  reducedMotion = false,
} = {}) {
  const waiting = [];
  const seen = new Set();
  let active = false;
  let timer = null;
  let destroyed = false;

  const pump = () => {
    if (destroyed || active || waiting.length === 0) return;
    active = true;
    const transaction = waiting.shift();
    present(transaction);
    announce(transaction);
    const finish = () => {
      timer = null;
      settle(transaction);
      active = false;
      pump();
    };
    if (reducedMotion) finish();
    else timer = scheduler(finish, duration);
  };

  return {
    enqueue(transaction) {
      if (!transaction?.id || seen.has(transaction.id) || destroyed) return false;
      seen.add(transaction.id);
      waiting.push(transaction);
      pump();
      return true;
    },
    clear() {
      waiting.length = 0;
      if (timer !== null) cancel(timer);
      timer = null;
      active = false;
    },
    destroy() {
      this.clear();
      destroyed = true;
    },
  };
}

export function createMoneyFeedback({ host, balanceNode, reducedMotion = false }) {
  let activeLabel = null;
  return createMoneyQueue({
    reducedMotion,
    present(transaction) {
      const label = document.createElement("span");
      label.className = "money-delta " + (transaction.amount >= 0 ? "money-delta--gain" : "money-delta--loss");
      label.textContent = (transaction.amount >= 0 ? "+" : "−") + formatRand(Math.abs(transaction.amount));
      host.replaceChildren(label);
      activeLabel = label;
      requestAnimationFrame(() => label.classList.add("money-delta--visible"));
    },
    settle(transaction) {
      if (activeLabel) activeLabel.remove();
      activeLabel = null;
      balanceNode.textContent = formatRand(transaction.balance);
      balanceNode.classList.remove("balance-settle");
      void balanceNode.offsetWidth;
      balanceNode.classList.add("balance-settle");
    },
    announce(transaction) {
      host.setAttribute("aria-label", (transaction.amount >= 0 ? "Cash increased by " : "Cash decreased by ") + formatRand(Math.abs(transaction.amount)));
    },
  });
}
