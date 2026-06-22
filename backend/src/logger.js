const COLORS = {
  INFO: "\x1b[36m",
  STEP: "\x1b[35m",
  TOOL: "\x1b[33m",
  OK: "\x1b[32m",
  ERROR: "\x1b[31m",
};
const RESET = "\x1b[0m";

function log(level, message, data) {
  const ts = new Date().toISOString();
  const color = COLORS[level] || "";
  const base = `${color}[${ts}] ${level.padEnd(5)}${RESET} ${message}`;
  if (data !== undefined) {
    console.log(base, typeof data === "string" ? data : JSON.stringify(data));
  } else {
    console.log(base);
  }
}

export default {
  info: (m, d) => log("INFO", m, d),
  step: (m, d) => log("STEP", m, d),
  tool: (m, d) => log("TOOL", m, d),
  ok: (m, d) => log("OK", m, d),
  error: (m, d) => log("ERROR", m, d),
};
