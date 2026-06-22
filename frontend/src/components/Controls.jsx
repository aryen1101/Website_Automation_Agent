export default function Controls({
  url,
  goal,
  onUrl,
  onGoal,
  running,
  config,
  configError,
  onRun,
  onStop,
}) {
  const hint = configError
    ? "Backend not reachable on this origin."
    : config
    ? `Max steps: ${config.maxSteps ?? "—"} · headless: ${
        config.headless ? "on" : "off"
      }`
    : "Loading config…";

  return (
    <section className="controls card">
      <div className="field">
        <label htmlFor="url">Target URL</label>
        <input
          id="url"
          type="url"
          placeholder="https://example.com"
          autoComplete="off"
          spellCheck="false"
          value={url}
          disabled={running}
          onChange={(e) => onUrl(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="goal">Goal</label>
        <textarea
          id="goal"
          rows={3}
          placeholder="Describe what the agent should do on the page…"
          value={goal}
          disabled={running}
          onChange={(e) => onGoal(e.target.value)}
        />
      </div>

      <div className="controls__actions">
        <div className="controls__hint">{hint}</div>
        <button
          type="button"
          className={`btn ${running ? "btn--danger" : "btn--primary"}`}
          onClick={running ? onStop : onRun}
        >
          <span className="btn__icon">{running ? "■" : "▶"}</span>
          <span>{running ? "Stop" : "Run agent"}</span>
        </button>
      </div>
    </section>
  );
}
