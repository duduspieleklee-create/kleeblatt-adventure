interface StatusCardProps {
  health: string;
}

export function StatusCard({ health }: StatusCardProps) {
  return (
    <section className="card">
      <h2>Status</h2>
      <p>
        Backend: <strong>{health}</strong>
      </p>
      <p className="hint">
        Docs: <code>docs/architecture/20-prototyp-checkliste.md</code>
      </p>
    </section>
  );
}
