import { getMaxHp, getMaxResource, getResourceType } from "../lib/gameStats";
import { UI_ASSETS } from "../lib/uiAssets";

interface StatusCardProps {
  health: string;
  hero: import("@kleeblatt/shared").Hero | null;
}

function ResourceBar({ label, current, max, assets }: { label: string; current: number; max: number; assets: readonly string[] }) {
  const pct = max > 0 ? current / max : 0;
  const idx = Math.max(0, Math.min(assets.length - 1, Math.round(pct * (assets.length - 1))));
  return (
    <div className="resource-bar">
      <span className="resource-label">{label}</span>
      <img src={assets[idx]} alt={`${label} ${Math.round(pct * 100)}%`} className="resource-img" />
    </div>
  );
}

export function StatusCard({ health, hero }: StatusCardProps) {
  return (
    <section className="card">
      <h2>Status</h2>
      <p>
        Backend: <strong>{health}</strong>
      </p>
      {hero && (
        <div className="resources">
          <ResourceBar label="HP" current={getMaxHp(hero)} max={getMaxHp(hero)} assets={UI_ASSETS.bars.red} />
          <ResourceBar
            label={getResourceType(hero) === "mana" ? "Mana" : "Stamina"}
            current={getMaxResource(hero)}
            max={getMaxResource(hero)}
            assets={getResourceType(hero) === "mana" ? UI_ASSETS.bars.blue : UI_ASSETS.bars.green}
          />
          <ResourceBar label="Stamina" current={getMaxResource(hero)} max={getMaxResource(hero)} assets={UI_ASSETS.bars.green} />
        </div>
      )}
      <p className="hint">
        Docs: <code>docs/architecture/20-prototyp-checkliste.md</code>
      </p>
    </section>
  );
}
