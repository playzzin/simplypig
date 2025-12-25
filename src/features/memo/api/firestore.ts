import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
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
import { memoCategoryDocSchema, memoDocSchema } from "../schemas";
import type { Memo, MemoCategory, MemoCategoryCreateInput, MemoCreateInput, SecretMemoEncryptedPayload, TodoItem } from "../types";

const toDate = (value: unknown): Date => {
    if (value instanceof Date) return value;
    if (value instanceof Timestamp) return value.toDate();
    throw new Error("Invalid Firestore timestamp value");
};

const COLLECTIONS = {
    categories: "memo_categories",
    memos: "memos",
} as const;

const memoCategoryConverter: FirestoreDataConverter<MemoCategory> = {
    toFirestore: (modelObject: WithFieldValue<MemoCategory>): DocumentData => {
        const { id: _id, ...rest } = modelObject;
        return rest;
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): MemoCategory => {
        const raw = snapshot.data(options) as Record<string, unknown>;
        const parsed = memoCategoryDocSchema.parse({
            ...raw,
            createdAt: toDate(raw.createdAt),
            updatedAt: toDate(raw.updatedAt),
        });
        return { id: snapshot.id, ...parsed };
    },
};

const memoConverter: FirestoreDataConverter<Memo> = {
    toFirestore: (modelObject: WithFieldValue<Memo>): DocumentData => {
        const { id: _id, ...rest } = modelObject;
        return rest;
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Memo => {
        const raw = snapshot.data(options) as Record<string, unknown>;
        const parsed = memoDocSchema.parse({
            ...raw,
            createdAt: toDate(raw.createdAt),
            updatedAt: toDate(raw.updatedAt),
        });
        const type = ("type" in parsed && parsed.type ? parsed.type : "text") as Memo["type"];
        if (type === "text") {
            const textParsed = parsed as Omit<Memo, "id" | "type"> & { content: string };
            return {
                id: snapshot.id,
                type: "text",
                userId: textParsed.userId,
                title: textParsed.title,
                categoryId: textParsed.categoryId,
                content: textParsed.content,
                createdAt: textParsed.createdAt,
                updatedAt: textParsed.updatedAt,
            };
        }
        if (type === "todo") {
            const todoParsed = parsed as Omit<Memo, "id" | "type"> & { items: TodoItem[] };
            return {
                id: snapshot.id,
                type: "todo",
                userId: todoParsed.userId,
                title: todoParsed.title,
                categoryId: todoParsed.categoryId,
                items: todoParsed.items,
                createdAt: todoParsed.createdAt,
                updatedAt: todoParsed.updatedAt,
            };
        }
        const secretParsed = parsed as Omit<Memo, "id" | "type"> & { encrypted: SecretMemoEncryptedPayload };
        return {
            id: snapshot.id,
            type: "secret",
            userId: secretParsed.userId,
            title: secretParsed.title,
            categoryId: secretParsed.categoryId,
            encrypted: secretParsed.encrypted,
            createdAt: secretParsed.createdAt,
            updatedAt: secretParsed.updatedAt,
        };
    },
};

const categoriesCol = collection(db, COLLECTIONS.categories).withConverter(memoCategoryConverter);
const memosCol = collection(db, COLLECTIONS.memos).withConverter(memoConverter);

export const listMemoCategories = async (uid: string): Promise<MemoCategory[]> => {
    const q = query(categoriesCol, where("userId", "==", uid));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => d.data());
    // index 없이도 동작하도록 client-side 정렬(업데이트순)
    return items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const createMemoCategory = async (uid: string, input: MemoCategoryCreateInput): Promise<string> => {
    const created = await addDoc(categoriesCol, {
        userId: uid,
        name: input.name,
        colorHex: input.colorHex,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    } as WithFieldValue<Omit<MemoCategory, "id">>);
    return created.id;
};

export const deleteMemoCategory = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.categories, id));
};

export const listMemos = async (uid: string): Promise<Memo[]> => {
    const q = query(memosCol, where("userId", "==", uid));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => d.data());
    return items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const createMemo = async (uid: string, input: MemoCreateInput): Promise<string> => {
    const isTodo = "items" in input;
    const isSecret = "encrypted" in input;
    const created = await addDoc(memosCol, {
        userId: uid,
        type: isSecret ? "secret" : isTodo ? "todo" : "text",
        title: input.title,
        categoryId: input.categoryId,
        ...(isSecret ? { encrypted: input.encrypted } : isTodo ? { items: input.items } : { content: input.content }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    } as WithFieldValue<Omit<Memo, "id">>);
    return created.id;
};

export const deleteMemo = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.memos, id));
};

export const updateTodoItems = async (id: string, items: TodoItem[]): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.memos, id), {
        items,
        updatedAt: serverTimestamp(),
    });
};

export const getMemoById = async (uid: string, memoId: string): Promise<Memo> => {
    const ref = doc(memosCol, memoId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("메모를 찾을 수 없습니다.");
    const memo = snap.data();
    if (memo.userId !== uid) throw new Error("권한이 없습니다.");
    return memo;
};

export const updateTextMemo = async (uid: string, memoId: string, next: { title: string; content: string; categoryId: string }): Promise<void> => {
    const current = await getMemoById(uid, memoId);
    if (current.type !== "text") throw new Error("text 메모가 아닙니다.");
    await updateDoc(doc(db, COLLECTIONS.memos, memoId), {
        type: "text",
        title: next.title,
        content: next.content,
        categoryId: next.categoryId,
        updatedAt: serverTimestamp(),
    });
};

export const updateTodoMemo = async (uid: string, memoId: string, next: { title: string; categoryId: string; items: TodoItem[] }): Promise<void> => {
    const current = await getMemoById(uid, memoId);
    if (current.type !== "todo") throw new Error("todo 메모가 아닙니다.");
    await updateDoc(doc(db, COLLECTIONS.memos, memoId), {
        type: "todo",
        title: next.title,
        categoryId: next.categoryId,
        items: next.items,
        updatedAt: serverTimestamp(),
    });
};

export const updateSecretMemo = async (
    uid: string,
    memoId: string,
    next: { categoryId: string; encrypted: SecretMemoEncryptedPayload }
): Promise<void> => {
    const current = await getMemoById(uid, memoId);
    if (current.type !== "secret") throw new Error("secret 메모가 아닙니다.");
    await updateDoc(doc(db, COLLECTIONS.memos, memoId), {
        type: "secret",
        title: "비밀 메모",
        categoryId: next.categoryId,
        encrypted: next.encrypted,
        updatedAt: serverTimestamp(),
    });
};

export const updateMemoCategory = async (uid: string, memoId: string, categoryId: string): Promise<void> => {
    const current = await getMemoById(uid, memoId);
    if (current.userId !== uid) throw new Error("권한이 없습니다.");
    await updateDoc(doc(memosCol, memoId), {
        categoryId,
        updatedAt: serverTimestamp(),
    });
};


