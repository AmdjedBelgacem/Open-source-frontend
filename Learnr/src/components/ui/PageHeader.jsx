import './UiPrimitives.css';

export default function PageHeader({ eyebrow, title, subtitle, actions, className = '' }) {
  return (
    <header className={`ui-page-header ${className}`.trim()}>
      <div className="ui-page-header__copy">
        {eyebrow ? <p className="ui-page-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="ui-page-header__title">{title}</h1>
        {subtitle ? <p className="ui-page-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ui-page-header__actions">{actions}</div> : null}
    </header>
  );
}