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
  signOut,
  getRedirectResult,
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

  // ✅ 로그인: 리디렉션 방식 고정
  const signInWithGoogle = async () => {
    try {
      console.log("🚀 Starting Google redirect sign-in...");
      console.log("🌐 Current domain:", window.location.origin);

      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Google redirect sign-in error:", error);

      if (error.code === "auth/unauthorized-domain") {
        console.error("🚫 Unauthorized domain:", window.location.origin);
        alert(
          `Firebase Error: Domain '${window.location.origin}' is not authorized.\n\n` +
            `Please add this domain in Firebase Console → Authentication → Settings → Authorized domains`,
        );
      }

      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setAppUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateAppUser = async (userData: Partial<AppUser>) => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, userData, { merge: true });
      setAppUser((prev) =>
        prev ? ({ ...prev, ...userData } as AppUser) : (userData as AppUser),
      );
    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    }
  };

  // ✅ 초기 로그인 상태 확인 + 리디렉션 결과 처리
  useEffect(() => {
    console.log("👀 Setting up Firebase Auth listener...");

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 Auth state changed:", firebaseUser?.email);
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const result = await getRedirectResult(auth);
          if (result?.user) {
            console.log("✅ Redirect login success:", result.user.email);
          }

          const userRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            console.log("✅ Found user in Firestore:", userDoc.data());
            setAppUser(userDoc.data() as AppUser);
          } else {
            console.log("🆕 New user — creating basic profile");
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
        } catch (error) {
          console.error("Auth state handling error:", error);
          setAppUser(null);
        }
      } else {
        console.log("🚪 User logged out");
        setAppUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    appUser,
    loading,
    signInWithGoogle,
    logout,
    updateAppUser,
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
