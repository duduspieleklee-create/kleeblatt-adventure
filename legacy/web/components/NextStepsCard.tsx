import { NEXT_STEPS, PATCH_LOG, issueUrl } from "../lib/roadmap";

export function NextStepsCard() {
  return (
    <>
      <section className="card">
        <h2>Nächste Schritte</h2>
        <ol className="next-steps">
          {NEXT_STEPS.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              <span className="muted">{step.detail}</span>
              {step.issue ? (
                <a className="issue-link" href={issueUrl(step.issue)}>
                  #{step.issue}
                </a>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="card muted">
        <h2>Patch-Log</h2>
        {PATCH_LOG.map((entry) => (
          <div key={entry.title} className="patch-entry">
            <h3>
              {entry.title} <span className="badge">{entry.date}</span>
            </h3>
            <ul>
              {entry.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </>
  );
}
