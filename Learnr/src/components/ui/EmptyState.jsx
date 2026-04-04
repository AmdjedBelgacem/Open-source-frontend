import './UiPrimitives.css';

export default function EmptyState({ icon, title, description, actions, className = '' }) {
  return (
    <section className={`ui-empty-state ${className}`.trim()}>
      {icon ? <div className="ui-empty-state__icon">{icon}</div> : null}
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {actions ? <div className="ui-empty-state__actions">{actions}</div> : null}
    </section>
  );
}