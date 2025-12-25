import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createMemo,
    deleteMemo,
    getMemoById,
    listMemos,
    updateSecretMemo,
    updateTextMemo,
    updateTodoItems,
    updateTodoMemo,
    updateMemoCategory,
} from "../api/firestore";
import { memoCreateSchema, secretMemoCreateSchema, textMemoCreateSchema, todoMemoCreateSchema } from "../schemas";
import type { Memo, MemoCreateInput, TodoItem } from "../types";

const memoKeys = {
    all: (uid: string) => ["memos", uid] as const,
    byId: (uid: string, memoId: string) => ["memos", uid, memoId] as const,
};

export const useMemosQuery = (uid: string | null) => {
    return useQuery<Memo[]>({
        queryKey: uid ? memoKeys.all(uid) : ["memos", "no-user"],
        enabled: Boolean(uid),
        queryFn: async () => {
            if (!uid) return [];
            return await listMemos(uid);
        },
        staleTime: 10_000,
    });
};

export const useCreateMemoMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: MemoCreateInput) => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            const validated = memoCreateSchema.parse(input);
            return await createMemo(uid, validated);
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: memoKeys.all(uid) });
        },
    });
};

export const useUpdateMemoCategoryMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { memoId: string; categoryId: string }) => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            await updateMemoCategory(uid, payload.memoId, payload.categoryId);
        },
        onSuccess: async (_data, variables) => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: memoKeys.all(uid) });
            await queryClient.invalidateQueries({ queryKey: memoKeys.byId(uid, variables.memoId) });
        },
    });
};

export const useDeleteMemoMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (memoId: string) => {
            await deleteMemo(memoId);
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: memoKeys.all(uid) });
        },
    });
};

export const useUpdateTodoItemsMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { memoId: string; items: TodoItem[] }) => {
            await updateTodoItems(payload.memoId, payload.items);
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: memoKeys.all(uid) });
        },
    });
};

export const useMemoByIdQuery = (uid: string | null, memoId: string | null) => {
    return useQuery<Memo>({
        queryKey: uid && memoId ? memoKeys.byId(uid, memoId) : ["memos", "no-user", memoId ?? "no-id"],
        enabled: Boolean(uid && memoId),
        queryFn: async () => {
            if (!uid || !memoId) throw new Error("잘못된 요청입니다.");
            return await getMemoById(uid, memoId);
        },
        staleTime: 10_000,
    });
};

export const useUpdateTextMemoMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { memoId: string; title: string; content: string; categoryId: string }) => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            const validated = textMemoCreateSchema.parse({ type: "text", title: payload.title, content: payload.content, categoryId: payload.categoryId });
            await updateTextMemo(uid, payload.memoId, validated);
        },
        onSuccess: async (_data, variables) => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: memoKeys.all(uid) });
            await queryClient.invalidateQueries({ queryKey: memoKeys.byId(uid, variables.memoId) });
        },
    });
};

export const useUpdateTodoMemoMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { memoId: string; title: string; categoryId: string; items: TodoItem[] }) => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            const validated = todoMemoCreateSchema.parse({ type: "todo", title: payload.title, categoryId: payload.categoryId, items: payload.items });
            await updateTodoMemo(uid, payload.memoId, validated);
        },
        onSuccess: async (_data, variables) => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: memoKeys.all(uid) });
            await queryClient.invalidateQueries({ queryKey: memoKeys.byId(uid, variables.memoId) });
        },
    });
};

export const useUpdateSecretMemoMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { memoId: string; categoryId: string; encrypted: unknown }) => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            const validated = secretMemoCreateSchema.parse({ type: "secret", title: "비밀 메모", categoryId: payload.categoryId, encrypted: payload.encrypted });
            await updateSecretMemo(uid, payload.memoId, { categoryId: validated.categoryId, encrypted: validated.encrypted });
        },
        onSuccess: async (_data, variables) => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: memoKeys.all(uid) });
            await queryClient.invalidateQueries({ queryKey: memoKeys.byId(uid, variables.memoId) });
        },
    });
};


