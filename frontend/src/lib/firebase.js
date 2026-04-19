import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD3gcCxNFkGIjF1vUy1WG5i4CweEcKNhos",
  authDomain: "resume-a1a53.firebaseapp.com",
  projectId: "resume-a1a53",
  storageBucket: "resume-a1a53.firebasestorage.app",
  messagingSenderId: "744102944077",
  appId: "1:744102944077:web:0d5aee1be376c3cdf2eb04",
  measurementId: "G-YNZ2EYWYL2",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) getAnalytics(app);
    })
    .catch(() => {
      // Ignore analytics initialization failures in unsupported environments.
    });
}

export { app, auth, googleProvider };
