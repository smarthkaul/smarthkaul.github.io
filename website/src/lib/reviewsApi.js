// Firebase access for the Reviews page. Only the lazily-loaded reviews route
// imports this, so the Firebase SDK stays out of the main bundle.
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore/lite";
import { FIREBASE_CONFIG } from "./firebaseConfig";

let services = null;
function firebase() {
  if (!services) {
    const app = initializeApp(FIREBASE_CONFIG);
    services = { auth: getAuth(app), db: getFirestore(app) };
  }
  return services;
}

const reviewsCol = () => collection(firebase().db, "reviews");

function fromSnapshot(snap) {
  const data = snap.data();
  return {
    id: snap.id,
    title: data.title,
    category: data.category,
    rating: data.rating,
    body: data.body,
    createdAt: data.createdAt?.toDate() ?? null,
  };
}

export async function listReviews() {
  const snap = await getDocs(query(reviewsCol(), orderBy("createdAt", "desc")));
  return snap.docs.map(fromSnapshot);
}

export async function getReview(id) {
  const snap = await getDoc(doc(reviewsCol(), id));
  return snap.exists() ? fromSnapshot(snap) : null;
}

export async function createReview(review) {
  const ref = await addDoc(reviewsCol(), {
    ...review,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export function updateReview(id, review) {
  return updateDoc(doc(reviewsCol(), id), { ...review, updatedAt: serverTimestamp() });
}

export function deleteReview(id) {
  return deleteDoc(doc(reviewsCol(), id));
}

export function watchUser(callback) {
  return onAuthStateChanged(firebase().auth, callback);
}

export function signInOwner() {
  return signInWithPopup(firebase().auth, new GoogleAuthProvider());
}

export function signOutOwner() {
  return signOut(firebase().auth);
}
