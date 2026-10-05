"use client";

import { useEffect, useMemo, useState } from "react";
import type { DeskStatus } from "@/lib/status";

const COPY: Record<DeskStatus, { label: string; note: string }> = {
  working: { label: "在上班", note: "可以来找我" },
  meeting: { label: "开会中", note: "请稍后再来" },
  lunch: { label: "吃饭中", note: "13:30 后回来" },
  off: { label: "下班了", note: "明天见" },
};

function londonParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    weekday: value("weekday"),
    hour: Number(value("hour")),
    minute: Number(value("minute")),
  };
}

function deriveStaticStatus(date: Date): DeskStatus {
  const { weekday, hour, minute } = londonParts(date);
  if (weekday === "Sat" || weekday === "Sun") return "off";
  const minutes = hour * 60 + minute;
  if (minutes < 9 * 60 || minutes >= 21 * 60) return "off";
  if (minutes >= 12 * 60 + 30 && minutes < 13 * 60 + 30) return "lunch";
  return "working";
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export default function StatusBoard() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const status = useMemo(() => (now ? deriveStaticStatus(now) : null), [now]);

  if (!now || !status) {
    return (
      <main className="board board-loading" aria-label="正在读取状态">
        <div className="loading-line" />
        <div className="loading-line loading-line-short" />
      </main>
    );
  }

  const copy = COPY[status];
  return (
    <main className={`board status-${status}`}>
      <div className="identity">Eason</div>
      <section className="status-content" aria-live="polite">
        <div className="status-symbol" aria-hidden="true">
          {status === "lunch" ? "◐" : status === "off" ? "○" : "✓"}
        </div>
        <h1>{copy.label}</h1>
        <p>{copy.note}</p>
      </section>
      <footer>
        <span>根据固定工作时间自动更新</span>
        <time dateTime={now.toISOString()}>伦敦时间 {formatTime(now)}</time>
      </footer>
    </main>
  );
}
