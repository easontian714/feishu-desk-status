"use client";

import { useCallback, useEffect, useState } from "react";
import type { DeskStatus } from "@/lib/status";

type Payload = { status: DeskStatus; until: string | null; refreshedAt: string };

const COPY: Record<DeskStatus, { label: string; note: string }> = {
  working: { label: "在上班", note: "可以来找我" },
  meeting: { label: "开会中", note: "请稍后再来" },
  lunch: { label: "吃饭中", note: "13:30 后回来" },
  off: { label: "下班了", note: "明天见" },
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

export default function StatusBoard() {
  const [data, setData] = useState<Payload | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [stale, setStale] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      if (response.status === 401) {
        setAuthorized(false);
        return;
      }
      if (!response.ok) throw new Error("status unavailable");
      setData((await response.json()) as Payload);
      setAuthorized(true);
      setStale(false);
    } catch {
      setStale(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  if (authorized === false) {
    return (
      <main className="board board-auth">
        <section className="auth-panel" aria-labelledby="auth-title">
          <div className="mark" aria-hidden="true">E</div>
          <h1 id="auth-title">连接飞书日历</h1>
          <p>只读取日程时间和忙闲状态，不展示会议内容。</p>
          <a className="button" href="/api/auth/login">连接我的日历</a>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="board board-loading" aria-label="正在读取状态">
        <div className="loading-line" />
        <div className="loading-line loading-line-short" />
      </main>
    );
  }

  const copy = COPY[data.status];
  const note = data.status === "meeting" && data.until
    ? `预计 ${formatTime(data.until)} 结束`
    : copy.note;

  return (
    <main className={`board status-${data.status}`}>
      <div className="identity">Eason</div>
      <section className="status-content" aria-live="polite">
        <div className="status-symbol" aria-hidden="true">
          {data.status === "meeting" ? "●" : data.status === "lunch" ? "◐" : data.status === "off" ? "○" : "✓"}
        </div>
        <h1>{copy.label}</h1>
        <p>{note}</p>
      </section>
      <footer>
        <span>{stale ? "暂未更新，展示最近状态" : "根据飞书日历自动更新"}</span>
        <time dateTime={data.refreshedAt}>伦敦时间 {formatTime(data.refreshedAt)}</time>
      </footer>
    </main>
  );
}
