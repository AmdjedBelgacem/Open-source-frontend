import './UiPrimitives.css';

export default function CardGridSkeleton({ count = 8, className = '' }) {
  return (
    <div className={`ui-card-skeleton-grid ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="ui-card-skeleton">
          <div className="ui-card-skeleton__media" />
          <div className="ui-card-skeleton__body">
            <div className="ui-card-skeleton__pill" />
            <div className="ui-card-skeleton__line ui-card-skeleton__line--title" />
            <div className="ui-card-skeleton__line" />
            <div className="ui-card-skeleton__line ui-card-skeleton__line--short" />
            <div className="ui-card-skeleton__button" />
          </div>
        </div>
      ))}
    </div>
  );
}