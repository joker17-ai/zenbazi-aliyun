// 跨会话消费券余额桥梁：localStorage 持久化，使反馈奖励的消费券可在下一次消费时抵扣
const KEY = 'zenbazi-coupon-balance';

export function getCouponBalance() {
  try {
    return Number(localStorage.getItem(KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

export function setCouponBalance(n) {
  try {
    localStorage.setItem(KEY, String(Number(n) || 0));
  } catch {
    // localStorage 不可用时静默降级
  }
}
  