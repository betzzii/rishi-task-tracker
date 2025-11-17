import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


// TODO: REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


const $ = (sel) => document.querySelector(sel);

const taskForm = $("#task-form");
const taskList = $("#task-list");
const emptyState = $("#empty-state");
const userEmail = $("#user-email");
const yearEl = $("#year");
yearEl.textContent = new Date().getFullYear();


let currentUser = null;
let unsubscribe = null;


onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    userEmail.textContent = user.email;
    subscribe(user.uid);
  } else {
    userEmail.textContent = "";
    taskList.innerHTML = "";
    emptyState.style.display = "block";
  }
});


function subscribe(uid) {
  const q = query(
    collection(db, "tasks"),
    where("uid", "==", uid),
    orderBy("due")
  );

  if (unsubscribe) unsubscribe();

  unsubscribe = onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render(items);
  });
}


taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) return alert("Sign in first!");

  const title = $("#task-title").value.trim();
  const date = $("#task-date").value;

  await addDoc(collection(db, "tasks"), {
    uid: currentUser.uid,
    title,
    due: new Date(date),
    notes: $("#task-notes").value,
    important: $("#task-important").checked,
    done: false,
    createdAt: serverTimestamp()
  });

  taskForm.reset();
});


function render(items) {
  taskList.innerHTML = "";
  if (!items.length) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  items.forEach((t) => {
    const li = document.createElement("li");
    li.className = "task";

    li.innerHTML = `
      <div>
        <strong>${t.title}</strong>
        <div class="muted">${new Date(t.due).toDateString()}</div>
      </div>
      <button class="pill">${t.done ? "Undo" : "Done"}</button>
      <button class="pill danger">Delete</button>
    `;

    const [btnDone, btnDel] = li.querySelectorAll("button");

    btnDone.onclick = () =>
      updateDoc(doc(db, "tasks", t.id), { done: !t.done });

    btnDel.onclick = () =>
      deleteDoc(doc(db, "tasks", t.id));

    taskList.appendChild(li);
  });
}
