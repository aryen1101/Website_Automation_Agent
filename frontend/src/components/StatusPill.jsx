const LABELS = {
  idle: "idle",
  running: "running",
  done: "done",
  error: "error",
  stopped: "stopped",
};

export default function StatusPill({ status }) {
  return (
    <span className="status" data-state={status}>
      <span className="status__dot" />
      <span className="status__label">{LABELS[status] || status}</span>
    </span>
  );
}
