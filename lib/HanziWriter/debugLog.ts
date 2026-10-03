"use client";

// A tiny shared log buffer so every HanziWriterDrawing instance on the page
// can report what it's doing, and a single floating panel (HanziWriterDebugPanel)
// can show/copy all of it at once instead of squinting at per-square text.

type Listener = () => void;

const MAX_LOGS = 800;
let logs: string[] = [];
const listeners = new Set<Listener>();

function timestamp(): string {
  const d = new Date();
  const pad = (n: number, len = 2) => n.toString().padStart(len, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

export function logHanzi(tag: string, message: string): void {
  const line = `[${timestamp()}] [${tag}] ${message}`;
  logs.push(line);
  if (logs.length > MAX_LOGS) logs = logs.slice(logs.length - MAX_LOGS);
  console.log("[HanziWriter]", tag, message);
  listeners.forEach((listener) => listener());
}

export function getHanziLogs(): string[] {
  return logs;
}

export function clearHanziLogs(): void {
  logs = [];
  listeners.forEach((listener) => listener());
}

export function subscribeHanziLogs(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
