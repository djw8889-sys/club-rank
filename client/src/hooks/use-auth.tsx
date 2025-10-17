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
  signInWithRedirect,
  getRedirectResult,
  signOut,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User as AppUser } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateAppUser: (userData: Partial<AppUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  // ✅ Google 로그인 (redirect 방식)
  const signInWithGoogle = async () => {
    try {
      console.log("🚀 Redirecting to Google sign-in...");
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  };

  // ✅ 로그아웃
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setAppUser(null);
  };

  // ✅ Firestore 사용자 데이터 동기화
  const syncUserData = async (firebaseUser: User) => {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      console.log("✅ Firestore user found:", userDoc.data());
      setAppUser(userDoc.data() as AppUser);
    } else {
      console.log("🆕 Creating new user profile...");
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

  // ✅ 핵심 수정: getRedirectResult 먼저 실행
  useEffect(() => {
    (async () => {
      try {
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult?.user) {
          console.log(
            "✅ Redirect result detected:",
            redirectResult.user.email,
          );
          setUser(redirectResult.user);
          await syncUserData(redirectResult.user);
        }
      } catch (error) {
        console.error("Redirect result error:", error);
      }

      // 이후에 Auth 상태 변경 감시
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          console.log("🔥 Auth state changed:", firebaseUser.email);
          setUser(firebaseUser);
          await syncUserData(firebaseUser);
        } else {
          console.log("🚪 User logged out");
          setUser(null);
          setAppUser(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    })();
  }, []);

  const value = {
    user,
    appUser,
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
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
