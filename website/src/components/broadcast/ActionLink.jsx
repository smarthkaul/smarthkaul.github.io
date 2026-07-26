import { Link } from "react-router-dom";

// The single link treatment shared by project cards and detail pages. Passing
// `href` marks the link external and guarantees the target/rel pair; `to`
// routes internally. Keeping both behind one component is what stops the two
// call sites drifting apart.
const actionClass =
  "font-mono text-xs uppercase tracking-widest text-wimbledon hover:text-grass-dark transition-colors";

const ActionLink = ({ to, href, children }) =>
  href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={actionClass}>
      {children}
    </a>
  ) : (
    <Link to={to} className={actionClass}>
      {children}
    </Link>
  );

export default ActionLink;
