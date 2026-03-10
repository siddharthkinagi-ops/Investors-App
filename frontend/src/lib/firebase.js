import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAi7n5JCGlwfvdl9EHAHE418L7mBY5Jqic",
  authDomain: "investor-web-app-360c3.firebaseapp.com",
  projectId: "investor-web-app-360c3",
  storageBucket: "investor-web-app-360c3.firebasestorage.app",
  messagingSenderId: "14543028084",
  appId: "1:14543028084:web:352f04550afe1292eef621",
  measurementId: "G-85WP3B8Q9B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
