import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "firebase/auth";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User as AppUser } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  token: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateAppUser: (userData: Partial<AppUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      if (!result.user) throw new Error("로그인 실패");
      setUser(result.user);

      const idToken = await result.user.getIdToken(true);
      setToken(idToken);
      await syncUserData(result.user);
    } catch (err) {
      console.error("❌ Google login failed:", err);
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setAppUser(null);
    setToken(null);
  };

  const syncUserData = async (firebaseUser: User) => {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      setAppUser(userDoc.data() as AppUser);
    } else {
      const newUser: AppUser = {
        id: firebaseUser.uid,
        username:
          firebaseUser.displayName ||
          firebaseUser.email?.split("@")[0] ||
          "사용자",
        email: firebaseUser.email || "",
        photoURL: firebaseUser.photoURL,
        ntrp: "0.0",
        region: "",
        age: "0",
        bio: null,
        availableTimes: [],
        points: 1000,
        wins: 0,
        losses: 0,
        isProfileComplete: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(userRef, newUser);
      setAppUser(newUser);
    }
  };

  // ✅ 로그인 상태 감시 및 토큰 자동 갱신
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const idToken = await firebaseUser.getIdToken(true);
        setToken(idToken);
        await syncUserData(firebaseUser);
      } else {
        setUser(null);
        setAppUser(null);
        setToken(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    user,
    appUser,
    token,
    loading,
    signInWithGoogle,
    logout,
    updateAppUser: async (userData: Partial<AppUser>) => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, userData, { merge: true });
      setAppUser((prev) =>
        prev ? { ...prev, ...userData } : (userData as AppUser),
      );
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
