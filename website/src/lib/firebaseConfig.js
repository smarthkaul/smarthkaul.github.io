// Firebase web config for the Reviews page. Paste the values from
// Firebase console → Project settings → Your apps → Web app.
//
// None of this is secret: every Firebase web app ships its config to the
// browser. What stops strangers writing reviews is firestore.rules, which only
// lets OWNER_UID write.
export const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  appId: "",
};

// Your Firebase Auth user ID. Sign in on /reviews once and the page shows it;
// paste it here and into firestore.rules.
export const OWNER_UID = "";

export const isFirebaseConfigured = Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
