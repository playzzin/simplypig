import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { auth } from "../lib/firebase";

type EnsureAnonymousAuthState = {
    user: User | null;
    uid: string | null;
    isReady: boolean;
    error: string | null;
};

const getErrorMessage = (e: unknown): string => {
    if (e instanceof Error) return e.message;
    if (typeof e === "string") return e;
    try {
        return JSON.stringify(e);
    } catch {
        return "Unknown error";
    }
};

export const useEnsureAnonymousAuth = (): EnsureAnonymousAuthState => {
    const [user, setUser] = useState<User | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (nextUser) => {
            setUser(nextUser);
            setIsReady(true);

            // 개인용 앱이라도 Firestore rules/userId 분리를 위해 익명 로그인은 최소 안전장치로 유용함
            if (!nextUser) {
                try {
                    await signInAnonymously(auth);
                } catch (e: unknown) {
                    setError(getErrorMessage(e));
                }
            }
        });
        return () => unsub();
    }, []);

    const uid = useMemo(() => user?.uid ?? null, [user]);
    return { user, uid, isReady, error };
};


