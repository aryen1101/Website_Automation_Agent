export default function LiveView({ observation }) {
  const hasShot = observation?.screenshot;

  return (
    <div className="card view">
      <div className="card__head">
        <h2>Live view</h2>
        <div className="view__meta">
          {observation?.step != null && (
            <span className="chip">step {observation.step}</span>
          )}
          {observation?.url && (
            <span className="view__url" title={observation.url}>
              {observation.url}
            </span>
          )}
        </div>
      </div>

      <div className="view__stage">
        {hasShot ? (
          <img
            src={`data:image/png;base64,${observation.screenshot}`}
            alt="Live browser screenshot"
          />
        ) : (
          <div className="view__empty">
            <div className="view__empty-icon">🖥️</div>
            <p>The browser screenshot will appear here once a run starts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
