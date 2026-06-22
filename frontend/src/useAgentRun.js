import { useCallback, useEffect, useRef, useState } from "react";

let _id = 0;
const nextId = () => ++_id;

// Manages the connection to the backend agent: loads config, opens the SSE
// run stream, and exposes the live event log, latest screenshot and result.
export function useAgentRun() {
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | running | done | error | stopped
  const [events, setEvents] = useState([]);
  const [observation, setObservation] = useState(null); // { screenshot, step, url }
  const [result, setResult] = useState(null); // { success, summary, steps }

  const sourceRef = useRef(null);
  const runningRef = useRef(false);

  const pushEvent = useCallback((ev) => {
    setEvents((prev) => [...prev, { id: nextId(), ...ev }]);
  }, []);

  // Load backend defaults once on mount.
  useEffect(() => {
    let alive = true;
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => alive && setConfig(cfg))
      .catch(() => alive && setConfigError(true));
    return () => {
      alive = false;
    };
  }, []);

  const closeSource = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
    runningRef.current = false;
  }, []);

  // Clean up the stream if the component unmounts mid-run.
  useEffect(() => closeSource, [closeSource]);

  const handle = useCallback(
    (data) => {
      switch (data.type) {
        case "start":
          pushEvent({ kind: "start", title: "Run started", data });
          break;
        case "log":
          pushEvent({ kind: "log", title: "Log", text: data.message, step: data.step });
          break;
        case "observation":
          setObservation({
            screenshot: data.screenshot,
            step: data.step,
            url: data.url,
          });
          break;
        case "thought":
          pushEvent({ kind: "thought", title: "Thought", text: data.message, step: data.step });
          break;
        case "action":
          pushEvent({
            kind: "action",
            title: "Action",
            tool: data.tool,
            args: data.args,
            step: data.step,
          });
          break;
        case "result":
          pushEvent({ kind: "result", title: "Result", text: data.message, step: data.step });
          break;
        case "done":
          pushEvent({ kind: "done", title: "Task complete", text: data.summary, step: data.step });
          break;
        case "error":
          pushEvent({ kind: "error", title: "Error", text: data.message, step: data.step });
          setStatus("error");
          break;
        case "finished":
          setResult({ success: data.success, summary: data.summary, steps: data.steps });
          setStatus(data.success ? "done" : "error");
          closeSource();
          break;
        case "closed":
          break;
        default:
          break;
      }
    },
    [pushEvent, closeSource]
  );

  const start = useCallback(
    (url, goal) => {
      if (runningRef.current) return;
      if (!url?.trim() || !goal?.trim()) {
        pushEvent({
          kind: "error",
          title: "Missing input",
          text: "Please provide both a URL and a goal.",
        });
        return;
      }

      setEvents([]);
      setObservation(null);
      setResult(null);
      setStatus("running");
      runningRef.current = true;

      const qs = new URLSearchParams({ url: url.trim(), goal: goal.trim() });
      const source = new EventSource(`/api/run?${qs.toString()}`);
      sourceRef.current = source;

      source.onmessage = (e) => {
        try {
          handle(JSON.parse(e.data));
        } catch {
          /* ignore malformed frame */
        }
      };

      source.onerror = () => {
        // Fires when the server ends the stream or the connection drops.
        if (runningRef.current) {
          closeSource();
          setStatus((s) => (s === "running" ? "stopped" : s));
        }
      };
    },
    [handle, pushEvent, closeSource]
  );

  const stop = useCallback(() => {
    if (!runningRef.current) return;
    closeSource();
    setStatus("stopped");
    pushEvent({ kind: "error", title: "Stopped", text: "Run stopped by user." });
  }, [closeSource, pushEvent]);

  const clear = useCallback(() => {
    if (runningRef.current) return;
    setEvents([]);
    setResult(null);
  }, []);

  return {
    config,
    configError,
    status,
    events,
    observation,
    result,
    running: status === "running",
    start,
    stop,
    clear,
  };
}
