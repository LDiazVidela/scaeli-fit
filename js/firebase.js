// Conexión con Firebase (proyecto "scaeli"). La configuración es pública por diseño: la seguridad está en las reglas.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, collection, onSnapshot, setDoc, deleteDoc, getDoc, getDocs, writeBatch, increment, updateDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
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

function proveedor(quien) {
  if (quien === "apple") { const p = new OAuthProvider("apple.com"); p.addScope("email"); p.addScope("name"); p.setCustomParameters({ locale: "es" }); return p; }
  return provider;
}
export async function login(quien) {
  // Ventana emergente siempre: la redirección pierde el resultado en Safari/Chrome móvil cuando authDomain
  // es otro dominio. En la app instalada (pantalla de inicio) la emergente no abre: lo informamos.
  const nombre = quien === "apple" ? "Apple" : "Google";
  try { return await signInWithPopup(auth, proveedor(quien)); }
  catch (e) {
    const code = (e && e.code) || "";
    if (code === "auth/operation-not-allowed") throw Object.assign(new Error("Falta activar el ingreso con " + nombre + " en Firebase → Authentication → Sign-in method."), { code });
    if (code === "auth/account-exists-with-different-credential") throw Object.assign(new Error("Ese email ya entró con " + (quien === "apple" ? "Google" : "Apple") + ": usá ese botón."), { code });
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") throw Object.assign(new Error("Cerraste la ventana de " + nombre + " antes de terminar."), { code });
    if (code === "auth/unauthorized-domain") throw Object.assign(new Error("Este dominio no está autorizado en Firebase: agregá " + location.hostname + " en Authentication → Dominios autorizados."), { code });
    if (standalone() || code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment")
      throw Object.assign(new Error("Acá no se puede abrir la ventana de " + nombre + ". Entrá desde Safari o Chrome (no desde el ícono de inicio) y después volvé."), { code });
    throw e;
  }
}
export const logout = () => signOut(auth);
export const watchAuth = (cb) => onAuthStateChanged(auth, cb);
export const finishRedirect = () => getRedirectResult(auth).catch(() => null);

/* Capa de datos: todo lo de una persona vive en users/{uid}/... */
const limpiar = (v) => { if (Array.isArray(v)) return v.map((x) => (x === undefined ? null : limpiar(x)));
  if (v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype) { const o = {}; for (const k in v) if (v[k] !== undefined) o[k] = limpiar(v[k]); return o; } return v; };
export function userBackend(uid, onError) {
  const path = (p) => doc(db, "users/" + uid + "/" + p);
  const col = (c) => collection(db, "users/" + uid + "/" + c);
  const err = (e) => onError && onError(e);
  return {
    mode: "firestore", uid,
    watchDoc(p, cb) { return onSnapshot(path(p), (s) => cb(s.exists() ? s.data() : null), err); },
    watchCol(c, cb) { return onSnapshot(col(c), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), err); },
    // Firestore rechaza (y tira error en el acto) cualquier campo «undefined»: se limpian antes de guardar
    setDoc(p, data) { try { return setDoc(path(p), limpiar(data)); } catch (e) { return Promise.reject(e); } },
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
    deleteTrackFile(p) { return deleteObject(ref(storage, p)).catch(() => {}); },
    /* Códigos premium: viven en la raíz (codes/{CODIGO}); solo lectura + contador de usos. */
    async redeemCode(code) {
      const id = String(code || "").trim().toUpperCase().replace(/\s+/g, "");
      if (!id) return { ok: false, why: "Escribí el código." };
      const snap = await getDoc(doc(db, "codes/" + id));
      if (!snap.exists()) return { ok: false, why: "Ese código no existe." };
      const c = snap.data() || {};
      if (c.max > 0 && (c.uses || 0) >= c.max) return { ok: false, why: "Ese código ya se usó." };
      if (c.until && new Date(c.until) < new Date()) return { ok: false, why: "Ese código venció." };
      try { await updateDoc(doc(db, "codes/" + id), { uses: increment(1) }); } catch (e) { /* las reglas pueden impedirlo; no es grave */ }
      return { ok: true, code: id, days: c.days || 0, label: c.label || "" };
    }
  };
}

/* Sin cuenta: todo se guarda solo en este dispositivo (igual que en Daily). */
export function localBackend() {
  const K = "scaeli-fit-local";
  let store = {}; try { store = JSON.parse(localStorage.getItem(K) || "{}"); } catch (e) { store = {}; }
  const save = () => { try { localStorage.setItem(K, JSON.stringify(store)); } catch (e) {} };
  const subs = [];
  const listCol = (c) => Object.keys(store).filter((k) => k.startsWith(c + "/")).map((k) => ({ id: k.slice(c.length + 1), ...store[k] }));
  // avisa solo a quien mira ese documento o esa colección (como Firestore), no a toda la app
  const emit = (p) => subs.forEach((s) => { if (p && (s.c ? !p.startsWith(s.c + "/") : s.p !== p)) return; try { s.c ? s.cb(listCol(s.c)) : s.cb(store[s.p] === undefined ? null : store[s.p]); } catch (e) {} });
  return {
    mode: "local", uid: "local",
    watchDoc(p, cb) { const s = { p, cb }; subs.push(s); setTimeout(() => cb(store[p] === undefined ? null : store[p]), 0); return () => { const i = subs.indexOf(s); if (i >= 0) subs.splice(i, 1); }; },
    watchCol(c, cb) { const s = { c, cb }; subs.push(s); setTimeout(() => cb(listCol(c)), 0); return () => { const i = subs.indexOf(s); if (i >= 0) subs.splice(i, 1); }; },
    async setDoc(p, data) { store[p] = JSON.parse(JSON.stringify(data)); save(); emit(p); },
    async delDoc(p) { delete store[p]; save(); emit(p); },
    async importAll(dump) { let n = 0; for (const c of Object.keys(dump)) for (const id of Object.keys(dump[c] || {})) { store[c + "/" + id] = dump[c][id]; n++; } save(); emit(); return n; },
    async exportAll(cols) { const out = {}; for (const c of cols) { out[c] = {}; listCol(c).forEach((d) => { const { id, ...r } = d; out[c][id] = r; }); } return out; },
    async uploadTrack() { throw Object.assign(new Error("Sin cuenta no se pueden subir archivos."), { code: "local" }); },
    deleteTrackFile() {},
    async redeemCode(code) { return { ok: false, why: "Los códigos se canjean con tu cuenta de Google." }; },
    _borrarTodo() { store = {}; save(); emit(); }
  };
}

/* ── Grupo de perseverancia de Fit: mismos grupos/{gid} que Daily pero con tipo:"entreno" (Daily los oculta).
   Cada persona escribe SOLO su documento de miembro: grupos/{gid}/miembros/{uid} = {n, s:{lunes:{e,m,x}}, hoy:{f,ok}} ── */
const GID_LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const nuevoGid = () => { const a = new Uint8Array(8); crypto.getRandomValues(a); return Array.from(a, (x) => GID_LETRAS[x % GID_LETRAS.length]).join(""); };
export function gruposBackend(uid) {
  const g = (gid) => doc(db, "grupos/" + gid), m = (gid, u) => doc(db, "grupos/" + gid + "/miembros/" + u), col = (gid) => collection(db, "grupos/" + gid + "/miembros");
  return {
    mode: "firestore",
    async crear(nombre, miembro) { const gid = nuevoGid(); await setDoc(g(gid), { n: nombre, creador: uid, tipo: "entreno", t: Date.now() }); await setDoc(m(gid, uid), { ...miembro, t: Date.now() }); return gid; },
    async leer(gid) { const s = await getDoc(g(gid)); return s.exists() ? { id: gid, ...s.data() } : null; },
    watch(gid, cb) { let meta = null, L = null; const emit = () => cb(meta, L);
      const u1 = onSnapshot(g(gid), (s) => { meta = s.exists() ? { id: gid, ...s.data() } : false; emit(); }, (e) => cb(null, null, e));
      const u2 = onSnapshot(col(gid), (s) => { L = s.docs.map((d) => ({ uid: d.id, ...d.data() })); emit(); }, (e) => cb(null, null, e));
      return () => { u1(); u2(); }; },
    setMiembro(gid, data) { return setDoc(m(gid, uid), { ...data, t: Date.now() }, { merge: true }); },
    async salir(gid) { await deleteDoc(m(gid, uid)); try { const s = await getDocs(col(gid)); if (s.empty) { const d = await getDoc(g(gid)); if (d.exists() && d.data().creador === uid) await deleteDoc(g(gid)); } } catch (e) {} },
  };
}
export function gruposLocal(uid) { const K = "scaeli-fit-grupos"; let st = {}; try { st = JSON.parse(localStorage.getItem(K) || "{}"); } catch (e) { st = {}; }
  const save = () => { try { localStorage.setItem(K, JSON.stringify(st)); } catch (e) {} }; const subs = [];
  const emit = (gid) => subs.filter((s) => s.gid === gid).forEach((s) => { const G = st[gid]; s.cb(G ? { id: gid, ...G.meta } : false, G ? Object.entries(G.m).map(([u, d]) => ({ uid: u, ...d })) : []); });
  return {
    mode: "local",
    async crear(nombre, miembro) { const gid = nuevoGid(); st[gid] = { meta: { n: nombre, creador: uid, tipo: "entreno", t: Date.now() }, m: { [uid]: { ...miembro, t: Date.now() } } }; save(); return gid; },
    async leer(gid) { return st[gid] ? { id: gid, ...st[gid].meta } : null; },
    watch(gid, cb) { const s = { gid, cb }; subs.push(s); setTimeout(() => emit(gid), 0); return () => { const i = subs.indexOf(s); if (i >= 0) subs.splice(i, 1); }; },
    async setMiembro(gid, data) { const G = st[gid]; if (!G) return; G.m[uid] = { ...(G.m[uid] || {}), ...JSON.parse(JSON.stringify(data)), t: Date.now() }; save(); emit(gid); },
    async salir(gid) { const G = st[gid]; if (!G) return; delete G.m[uid]; if (!Object.keys(G.m).length) delete st[gid]; save(); emit(gid); },
    _sembrar(gid, miembros) { if (!st[gid]) return; Object.assign(st[gid].m, miembros); save(); emit(gid); },
  };
}
