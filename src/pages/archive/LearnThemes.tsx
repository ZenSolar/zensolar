import { Navigate } from "react-router-dom";

/**
 * /learn/themes is deprecated. The theme switcher now lives inline on /learn
 * itself — tap a pill, see the page change instantly. Redirect to /learn so
 * any old bookmarks land in the right place.
 */
export default function LearnThemes() {
  return <Navigate to="/learn" replace />;
}
