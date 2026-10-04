"use client";

type Listener = () => void;

const MAX_LOGS = 500;
let logs: string[] = [];
const listeners = new Set<Listener>();

function timestamp(): string {
  const d = new Date();
  const pad = (n: number, len = 2) => n.toString().padStart(len, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

export function logFSRS(event: string, data: Record<string, unknown> = {}): void {
  const line = `[${timestamp()}] [FSRS-6] ${event} ${JSON.stringify(data)}`;
  logs.push(line);
  if (logs.length > MAX_LOGS) logs = logs.slice(-MAX_LOGS);
  console.log(line);
  listeners.forEach((listener) => listener());
}

export function getFSRSLogs(): string[] {
  return logs;
}

export function clearFSRSLogs(): void {
  logs = [];
  listeners.forEach((listener) => listener());
}

export function subscribeFSRSLogs(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
