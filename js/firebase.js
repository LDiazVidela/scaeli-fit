// Conexión con Firebase (proyecto "scaeli"). La configuración es pública por diseño: la seguridad está en las reglas.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, collection, onSnapshot, setDoc, deleteDoc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDmiaXoh1wQGloS6KqDOOoZhWMkfQsOGnw",
  authDomain: "scaeli.firebaseapp.com",
  projectId: "scaeli",
  storageBucket: "scaeli.firebasestorage.app",
  messagingSenderId: "985684720340",
  appId: "1:985684720340:web:1a7cf65f28a56132aad941"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
let db;
try { db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
catch (e) { db = initializeFirestore(app, {}); }
export { db };
export const storage = getStorage(app);

const provider = new GoogleAuthProvider();
const standalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

export async function login() {
  // Ventana emergente siempre: la redirección pierde el resultado en Safari/Chrome móvil cuando authDomain
  // es otro dominio. En la app instalada (pantalla de inicio) la emergente no abre: lo informamos.
  try { return await signInWithPopup(auth, provider); }
  catch (e) {
    const code = (e && e.code) || "";
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") throw Object.assign(new Error("Cerraste la ventana de Google antes de terminar."), { code });
    if (code === "auth/unauthorized-domain") throw Object.assign(new Error("Este dominio no está autorizado en Firebase: agregá " + location.hostname + " en Authentication → Dominios autorizados."), { code });
    if (standalone() || code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment")
      throw Object.assign(new Error("Acá no se puede abrir la ventana de Google. Entrá desde Safari o Chrome (no desde el ícono de inicio) y después volvé."), { code });
    throw e;
  }
}
export const logout = () => signOut(auth);
export const watchAuth = (cb) => onAuthStateChanged(auth, cb);
export const finishRedirect = () => getRedirectResult(auth).catch(() => null);

/* Capa de datos: todo lo de una persona vive en users/{uid}/... */
export function userBackend(uid, onError) {
  const path = (p) => doc(db, "users/" + uid + "/" + p);
  const col = (c) => collection(db, "users/" + uid + "/" + c);
  const err = (e) => onError && onError(e);
  return {
    mode: "firestore", uid,
    watchDoc(p, cb) { return onSnapshot(path(p), (s) => cb(s.exists() ? s.data() : null), err); },
    watchCol(c, cb) { return onSnapshot(col(c), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), err); },
    setDoc(p, data) { return setDoc(path(p), data); },
    delDoc(p) { return deleteDoc(path(p)); },
    async importAll(dump) {
      // dump = { days:{id:doc}, workouts:{}, body:{}, combos:{}, recipes:{}, foods:{}, tracks:{}, settings:{} }
      let n = 0, batch = writeBatch(db), inBatch = 0;
      for (const c of Object.keys(dump)) {
        for (const id of Object.keys(dump[c] || {})) {
          batch.set(path(c + "/" + id), dump[c][id]); n++; inBatch++;
          if (inBatch >= 400) { await batch.commit(); batch = writeBatch(db); inBatch = 0; }
        }
      }
      if (inBatch) await batch.commit();
      return n;
    },
    async exportAll(cols) {
      const out = {};
      for (const c of cols) { const s = await getDocs(col(c)); out[c] = {}; s.docs.forEach((d) => out[c][d.id] = d.data()); }
      return out;
    },
    async uploadTrack(file, id) {
      const r = ref(storage, "users/" + uid + "/tracks/" + id + "-" + file.name.replace(/[^\w.\-]+/g, "_"));
      await uploadBytes(r, file, { contentType: file.type || "audio/mpeg" });
      return { path: r.fullPath, url: await getDownloadURL(r) };
    },
    deleteTrackFile(p) { return deleteObject(ref(storage, p)).catch(() => {}); }
  };
}
