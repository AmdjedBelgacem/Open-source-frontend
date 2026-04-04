export default function RouteSkeleton({ variant = 'app' }) {
  if (variant === 'auth') {
    return (
      <div className="route-skeleton route-skeleton--auth" aria-hidden="true">
        <div className="route-skeleton__auth-card">
          <div className="route-skeleton__auth-line route-skeleton__auth-line--title" />
          <div className="route-skeleton__auth-line" />
          <div className="route-skeleton__auth-input" />
          <div className="route-skeleton__auth-input" />
          <div className="route-skeleton__auth-btn" />
        </div>
      </div>
    );
  }

  return (
    <div className="route-skeleton route-skeleton--app" aria-hidden="true">
      <div className="route-skeleton__top" />
      <div className="route-skeleton__body">
        <div className="route-skeleton__card" />
        <div className="route-skeleton__row" />
        <div className="route-skeleton__row route-skeleton__row--short" />
      </div>
    </div>
  );
}