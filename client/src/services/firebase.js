import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD9kx8gj-_nG53_cWMngrOlr7BSUGvjnKw",
  authDomain: "resume-matcher-ojt-project.firebaseapp.com",
  projectId: "resume-matcher-ojt-project",
  storageBucket: "resume-matcher-ojt-project.firebasestorage.app",
  messagingSenderId: "170051065251",
  appId: "1:170051065251:web:4aa8c7429d94cf1e14b616",
  measurementId: "G-L186D9QY8Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Uploads a file to Firebase Storage and returns the public download URL.
 * 
 * @param {File} file 
 * @returns {Promise<string>} Download URL
 */
export const uploadToFirebase = async (file) => {
  if (!file) throw new Error("No file provided");

  // Create a unique file name to avoid collisions
  const uniqueName = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `resumes/${uniqueName}`);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // You could dispatch progress events here if you want a progress bar
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload is ${progress}% done`);
      },
      (error) => {
        console.error("Firebase upload error:", error);
        reject(error);
      },
      async () => {
        // Upload completed successfully, get the download URL
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};
