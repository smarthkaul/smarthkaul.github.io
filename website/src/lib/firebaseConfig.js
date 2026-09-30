// Firebase web config for the Reviews page. Paste the values from
// Firebase console → Project settings → Your apps → Web app.
//
// None of this is secret: every Firebase web app ships its config to the
// browser. What stops strangers writing reviews is firestore.rules, which only
// lets OWNER_UID write.
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCQ6l5ncn0r5R1KYf7bawQ6OP38bXOQpU0",
  authDomain: "smarthreviews.firebaseapp.com",
  projectId: "smarthreviews",
  appId: "1:871947678604:web:c323b97f968ec837a19ca9",
};

// Your Firebase Auth user ID. Sign in on /reviews once and the page shows it;
// paste it here and into firestore.rules.
export const OWNER_UID = "TcYKd1tCsXWh3A3GIy61dy6NtMB3";

export const isFirebaseConfigured = Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
