// The broadcast stat line: a key/value list under a rule, used for the About
// profile and for a project's results.
const StatList = ({ items, className = "" }) => (
  <dl
    className={`grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 border-t border-charcoal/10 pt-6 ${className}`}
  >
    {items.map(({ k, v }) => (
      <div
        key={k}
        className="flex items-baseline justify-between gap-4 border-b border-charcoal/10 py-2"
      >
        <dt className="font-mono text-xs uppercase tracking-widest text-charcoal/50">
          {k}
        </dt>
        <dd className="text-charcoal font-medium text-right">{v}</dd>
      </div>
    ))}
  </dl>
);

export default StatList;
