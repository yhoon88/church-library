// 한국 시간 기준 날짜 (YYYY-MM-DD)
export function todayKST() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export function addDays(ymd: string, days: number) {
  const d = new Date(ymd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function fmtDate(ymd: string) {
  const d = new Date(ymd.length === 10 ? ymd + "T00:00:00Z" : ymd);
  const k = ymd.length === 10 ? d : new Date(d.getTime() + 9 * 3600 * 1000);
  return `${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일`;
}

export function fmtFull(ymd: string) {
  const d = new Date(ymd.length === 10 ? ymd + "T00:00:00Z" : new Date(ymd).getTime() + 9 * 3600 * 1000);
  return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${String(d.getUTCDate()).padStart(2, "0")}`;
}
