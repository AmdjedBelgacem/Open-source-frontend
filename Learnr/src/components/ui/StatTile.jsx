import './UiPrimitives.css';

export default function StatTile({ label, value, className = '' }) {
  return (
    <article className={`ui-stat-tile ${className}`.trim()}>
      <p className="ui-stat-tile__label">{label}</p>
      <h3 className="ui-stat-tile__value">{value}</h3>
    </article>
  );
}