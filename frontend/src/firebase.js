import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; //imports firestore

const firebaseConfig = {
  apiKey: "AIzaSyAMCgxU11ta11LH8_vZ3g16JYX6dPI_A28",  //firebase webapi key
  authDomain: "cryptotrackerfinal-c68b8.firebaseapp.com",
  projectId: "cryptotrackerfinal-c68b8",
  storageBucket: "cryptotrackerfinal-c68b8.appspot.com",
  messagingSenderId: "477128965218",
  appId: "1:477128965218:web:51c354a3611a939303a53b"  //firebase appId
};

//initializes fire base and firebase authentication
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

//firestore database
const db = getFirestore(app);

//exports both db and auth
export { auth, db };