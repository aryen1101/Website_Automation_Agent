import { useEffect, useRef } from "react";

const ICONS = {
  start: "🚀",
  log: "•",
  action: "⚙",
  result: "✓",
  thought: "💭",
  error: "✕",
  done: "🏁",
};

function EventItem({ ev }) {
  return (
    <li className={`event event--${ev.kind}`}>
      <span className="event__icon">{ICONS[ev.kind] || "•"}</span>
      <div className="event__body">
        <div className="event__top">
          <span className="event__title">{ev.title}</span>
          {ev.step != null && <span className="event__step">step {ev.step}</span>}
        </div>
        <EventDetail ev={ev} />
      </div>
    </li>
  );
}

function EventDetail({ ev }) {
  if (ev.kind === "start") {
    return (
      <p className="event__detail">
        Goal: {ev.data.goal}
        <br />
        URL: <code>{ev.data.url}</code>
      </p>
    );
  }
  if (ev.kind === "action") {
    const hasArgs = ev.args && Object.keys(ev.args).length > 0;
    return (
      <p className="event__detail">
        <code>{ev.tool}</code>
        {hasArgs && <> <code>{JSON.stringify(ev.args)}</code></>}
      </p>
    );
  }
  if (ev.text) {
    return <p className="event__detail">{ev.text}</p>;
  }
  return null;
}

export default function Timeline({ events, running, onClear }) {
  const listRef = useRef(null);

  // Auto-scroll to the latest event as they stream in.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events]);

  return (
    <div className="card timeline">
      <div className="card__head">
        <h2>Activity</h2>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={onClear}
          disabled={running || events.length === 0}
        >
          Clear
        </button>
      </div>
      <ul className="events" ref={listRef}>
        {events.length === 0 ? (
          <li className="events__empty">
            No activity yet. Enter a goal and run the agent.
          </li>
        ) : (
          events.map((ev) => <EventItem key={ev.id} ev={ev} />)
        )}
      </ul>
    </div>
  );
}
