import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

async function test() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

    console.log("Fetching cand-2...");
    const docRef = doc(db, "candidates", "cand-2");
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      console.log("cand-2 does not exist!");
      return;
    }

    const candidate = docSnap.data();
    console.log("Candidate cand-2 fetched successfully. PhotoUrl is:", candidate.photoUrl);

    console.log("Trying to write cand-2 back to Firestore...");
    candidate.lastSaved = new Date().toISOString();
    await setDoc(docRef, candidate);
    console.log("Write success!");
  } catch (error) {
    console.error("Error during test:", error);
  }
}

test();
