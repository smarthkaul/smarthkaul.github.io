import { useEffect, useState } from "react";
import { isFirebaseConfigured, OWNER_UID } from "../lib/firebaseConfig";
import { watchUser } from "../lib/reviewsApi";

// Who's signed in on the Reviews page. `user` is undefined until Firebase
// reports back, then a user or null. Only OWNER_UID counts as the owner — the
// UI check is a convenience; firestore.rules is what actually blocks writes.
export function useReviewsOwner() {
  const [user, setUser] = useState(isFirebaseConfigured ? undefined : null);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    return watchUser(setUser);
  }, []);

  return {
    user,
    loading: user === undefined,
    isOwner: Boolean(user && OWNER_UID && user.uid === OWNER_UID),
  };
}
