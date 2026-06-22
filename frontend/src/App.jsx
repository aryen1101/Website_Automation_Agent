import { useEffect, useState } from "react";
import { useAgentRun } from "./useAgentRun.js";
import StatusPill from "./components/StatusPill.jsx";
import Controls from "./components/Controls.jsx";
import LiveView from "./components/LiveView.jsx";
import Timeline from "./components/Timeline.jsx";
import ResultBanner from "./components/ResultBanner.jsx";

export default function App() {
  const {
    config,
    configError,
    status,
    events,
    observation,
    result,
    running,
    start,
    stop,
    clear,
  } = useAgentRun();

  const [url, setUrl] = useState("");
  const [goal, setGoal] = useState("");

  // Prefill inputs from backend defaults once config arrives.
  useEffect(() => {
    if (config) {
      setUrl((u) => u || config.defaultUrl || "");
      setGoal((g) => g || config.defaultGoal || "");
    }
  }, [config]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand__mark">◑</div>
          <div className="brand__text">
            <h1>Website Automation Agent</h1>
            <p>Autonomous browser control, powered by an LLM</p>
          </div>
        </div>
        <div className="topbar__meta">
          <span className="badge">
            model: {configError ? "offline" : config?.model || "…"}
          </span>
          <StatusPill status={status} />
        </div>
      </header>

      <Controls
        url={url}
        goal={goal}
        onUrl={setUrl}
        onGoal={setGoal}
        running={running}
        config={config}
        configError={configError}
        onRun={() => start(url, goal)}
        onStop={stop}
      />

      <section className="workspace">
        <LiveView observation={observation} />
        <Timeline events={events} running={running} onClear={clear} />
      </section>

      {result && <ResultBanner result={result} />}
    </div>
  );
}
