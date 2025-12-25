import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    where,
    type DocumentData,
    type FirestoreDataConverter,
    type QueryDocumentSnapshot,
    type SnapshotOptions,
    type WithFieldValue,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { ytCategoryDocSchema, ytUserPrefsDocSchema, ytVideoDocSchema } from "../schemas";
import type { YtCategory, YtCategoryCreateInput, YtPlayerPrefs, YtUserPrefs, YtVideo, YtVideoCreateInput } from "../types";

const toDate = (value: unknown): Date => {
    if (value instanceof Date) return value;
    if (value instanceof Timestamp) return value.toDate();
    throw new Error("Invalid Firestore timestamp value");
};

const COLLECTIONS = {
    categories: "yt_categories",
    userPrefs: "yt_user_prefs",
    videos: "yt_videos",
} as const;

const ytCategoryConverter: FirestoreDataConverter<YtCategory> = {
    toFirestore: (modelObject: WithFieldValue<YtCategory>): DocumentData => {
        const { id: _id, ...rest } = modelObject;
        return rest;
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): YtCategory => {
        const raw = snapshot.data(options) as Record<string, unknown>;
        const parsed = ytCategoryDocSchema.parse({
            ...raw,
            createdAt: toDate(raw.createdAt),
            updatedAt: toDate(raw.updatedAt),
        });
        return { id: snapshot.id, ...parsed };
    },
};

const ytVideoConverter: FirestoreDataConverter<YtVideo> = {
    toFirestore: (modelObject: WithFieldValue<YtVideo>): DocumentData => {
        const { id: _id, ...rest } = modelObject;
        return rest;
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): YtVideo => {
        const raw = snapshot.data(options) as Record<string, unknown>;
        const parsed = ytVideoDocSchema.parse({
            ...raw,
            createdAt: toDate(raw.createdAt),
            updatedAt: toDate(raw.updatedAt),
            lastWatchedAt: raw.lastWatchedAt ? toDate(raw.lastWatchedAt) : null,
        });
        return { id: snapshot.id, ...parsed };
    },
};

const ytUserPrefsConverter: FirestoreDataConverter<YtUserPrefs> = {
    toFirestore: (modelObject: WithFieldValue<YtUserPrefs>): DocumentData => {
        const { id: _id, ...rest } = modelObject;
        return rest;
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): YtUserPrefs => {
        const raw = snapshot.data(options) as Record<string, unknown>;
        const parsed = ytUserPrefsDocSchema.parse({
            ...raw,
            updatedAt: toDate(raw.updatedAt),
        });
        return {
            id: snapshot.id,
            userId: parsed.userId,
            player: parsed.player,
            autoResume: parsed.autoResume,
            autoNext: parsed.autoNext,
            removeCompletedFromQueue: parsed.removeCompletedFromQueue,
            queue: parsed.queue,
            updatedAt: parsed.updatedAt,
        };
    },
};

const categoriesCol = collection(db, COLLECTIONS.categories).withConverter(ytCategoryConverter);
const userPrefsCol = collection(db, COLLECTIONS.userPrefs).withConverter(ytUserPrefsConverter);
const videosCol = collection(db, COLLECTIONS.videos).withConverter(ytVideoConverter);

export const listYtCategories = async (uid: string): Promise<YtCategory[]> => {
    const q = query(categoriesCol, where("userId", "==", uid));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => d.data());
    return items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const createYtCategory = async (uid: string, input: YtCategoryCreateInput): Promise<string> => {
    const created = await addDoc(categoriesCol, {
        userId: uid,
        name: input.name,
        colorHex: input.colorHex,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    } satisfies WithFieldValue<Omit<YtCategory, "id">>);
    return created.id;
};

export const updateYtCategory = async (uid: string, categoryId: string, next: { name: string; colorHex: string }): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.categories, categoryId), {
        userId: uid,
        name: next.name,
        colorHex: next.colorHex,
        updatedAt: serverTimestamp(),
    });
};

export const deleteYtCategory = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.categories, id));
};

export const listYtVideos = async (uid: string): Promise<YtVideo[]> => {
    const q = query(videosCol, where("userId", "==", uid));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => d.data());
    return items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const createYtVideo = async (uid: string, input: YtVideoCreateInput): Promise<string> => {
    const created = await addDoc(videosCol, {
        userId: uid,
        ...input,
        progressSec: 0,
        durationSec: null,
        lastWatchedAt: null,
        playerOverride: null,
        loopA: null,
        loopB: null,
        loopEnabled: false,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    } satisfies WithFieldValue<Omit<YtVideo, "id">>);
    return created.id;
};

export const updateYtVideoNote = async (uid: string, id: string, note: string): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.videos, id), {
        userId: uid,
        note,
        updatedAt: serverTimestamp(),
    });
};

export const updateYtVideo = async (
    uid: string,
    videoDocId: string,
    next: { title: string; categoryId: string; note: string }
): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.videos, videoDocId), {
        userId: uid,
        title: next.title,
        categoryId: next.categoryId,
        note: next.note,
        updatedAt: serverTimestamp(),
    });
};

export const deleteYtVideo = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.videos, id));
};

export const getYtUserPrefs = async (uid: string): Promise<YtUserPrefs> => {
    const ref = doc(userPrefsCol, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        const defaults: YtPlayerPrefs = { volume: 60, muted: false, playbackRate: 1, theaterMode: true };
        return {
            id: uid,
            userId: uid,
            player: defaults,
            autoResume: true,
            autoNext: true,
            removeCompletedFromQueue: true,
            queue: [],
            updatedAt: new Date(0),
        };
    }
    return snap.data();
};

export const setYtUserPrefs = async (
    uid: string,
    next: { player: YtPlayerPrefs; autoResume: boolean; autoNext: boolean; removeCompletedFromQueue: boolean }
): Promise<void> => {
    await setDoc(
        doc(db, COLLECTIONS.userPrefs, uid),
        {
            userId: uid,
            player: next.player,
            autoResume: next.autoResume,
            autoNext: next.autoNext,
            removeCompletedFromQueue: next.removeCompletedFromQueue,
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );
};

export const setYtUserQueue = async (uid: string, queue: string[]): Promise<void> => {
    await setDoc(
        doc(db, COLLECTIONS.userPrefs, uid),
        {
            userId: uid,
            queue,
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );
};

export const updateYtVideoProgress = async (
    uid: string,
    videoDocId: string,
    payload: { progressSec: number; durationSec?: number | null }
): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.videos, videoDocId), {
        userId: uid,
        progressSec: payload.progressSec,
        ...(payload.durationSec === undefined ? {} : { durationSec: payload.durationSec }),
        lastWatchedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

export const updateYtVideoPlayerOverride = async (uid: string, videoDocId: string, playerOverride: YtPlayerPrefs | null): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.videos, videoDocId), {
        userId: uid,
        playerOverride,
        updatedAt: serverTimestamp(),
    });
};

export const updateYtVideoLoop = async (
    uid: string,
    videoDocId: string,
    next: { loopA: number | null; loopB: number | null; loopEnabled: boolean }
): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.videos, videoDocId), {
        userId: uid,
        loopA: next.loopA,
        loopB: next.loopB,
        loopEnabled: next.loopEnabled,
        updatedAt: serverTimestamp(),
    });
};

export const updateYtVideoCompleted = async (uid: string, videoDocId: string, completed: boolean): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.videos, videoDocId), {
        userId: uid,
        completed,
        updatedAt: serverTimestamp(),
    });
};


