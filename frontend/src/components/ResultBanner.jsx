export default function ResultBanner({ result }) {
  const { success, summary, steps } = result;
  const stepText =
    steps != null ? ` (${steps} step${steps === 1 ? "" : "s"})` : "";

  return (
    <div className="result" data-state={success ? "success" : "fail"}>
      <span className="result__icon">{success ? "✅" : "⚠️"}</span>
      <div className="result__body">
        <strong>
          {success
            ? "Task completed successfully"
            : "Run finished without completing"}
        </strong>
        <p>
          {(summary || "No summary provided.") + stepText}
        </p>
      </div>
    </div>
  );
}
