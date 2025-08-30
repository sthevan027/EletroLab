import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';

// Config via variáveis de ambiente (Vercel) ou fallback local
declare const importMetaEnv: any;
const env: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) || (typeof importMetaEnv !== 'undefined' ? importMetaEnv : {});
const firebaseConfig = {
  apiKey: env.VITE_FB_API_KEY || '',
  authDomain: env.VITE_FB_AUTH_DOMAIN || '',
  projectId: env.VITE_FB_PROJECT_ID || '',
  storageBucket: env.VITE_FB_STORAGE || '',
  messagingSenderId: env.VITE_FB_MSG || '',
  appId: env.VITE_FB_APP_ID || ''
};

const enabled = !!firebaseConfig.projectId;

const app = enabled ? initializeApp(firebaseConfig) : undefined as any;
export const dbCloud = enabled ? getFirestore(app) : undefined as any;

export const cloud = {
  isEnabled(): boolean {
    return enabled;
  },

  getUserId(): string {
    // ID simples persistido no device; pode ser trocado por auth depois
    const KEY = 'eletrilab_user_id';
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  },

  async saveIRReport(userId: string, report: any): Promise<void> {
    if (!enabled) return;
    const ref = doc(collection(dbCloud, `users/${userId}/irReports`));
    await setDoc(ref, { ...report, createdAt: serverTimestamp() }, { merge: true });
  },

  async saveMultiReport(userId: string, report: any): Promise<void> {
    if (!enabled) return;
    const ref = doc(collection(dbCloud, `users/${userId}/multiReports`));
    await setDoc(ref, { ...report, createdAt: serverTimestamp() }, { merge: true });
  },

  async getRecentReports(userId: string, max = 10): Promise<any[]> {
    if (!enabled) return [];
    const irQ = query(collection(dbCloud, `users/${userId}/irReports`), orderBy('createdAt', 'desc'), limit(max));
    const mpQ = query(collection(dbCloud, `users/${userId}/multiReports`), orderBy('createdAt', 'desc'), limit(max));
    const [irSnap, mpSnap] = await Promise.all([getDocs(irQ), getDocs(mpQ)]);
    const list: any[] = [
      ...irSnap.docs.map(d => ({ id: d.id, type: 'ir', ...d.data() })),
      ...mpSnap.docs.map(d => ({ id: d.id, type: 'multi', ...d.data() }))
    ];
    return list
      .map(r => ({ ...r, createdAtMs: (r as any).createdAt?.toMillis?.() || 0 }))
      .sort((a, b) => b.createdAtMs - a.createdAtMs)
      .slice(0, max);
  }
};


