import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMemoCategory, deleteMemoCategory, listMemoCategories } from "../api/firestore";
import { memoCategoryCreateSchema } from "../schemas";
import type { MemoCategory, MemoCategoryCreateInput } from "../types";

const memoCategoryKeys = {
    all: (uid: string) => ["memoCategories", uid] as const,
};

export const useMemoCategoriesQuery = (uid: string | null) => {
    return useQuery<MemoCategory[]>({
        queryKey: uid ? memoCategoryKeys.all(uid) : ["memoCategories", "no-user"],
        enabled: Boolean(uid),
        queryFn: async () => {
            if (!uid) return [];
            return await listMemoCategories(uid);
        },
        staleTime: 15_000,
    });
};

export const useCreateMemoCategoryMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: MemoCategoryCreateInput) => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            const validated = memoCategoryCreateSchema.parse(input);
            return await createMemoCategory(uid, validated);
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: memoCategoryKeys.all(uid) });
        },
    });
};

export const useDeleteMemoCategoryMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (categoryId: string) => {
            await deleteMemoCategory(categoryId);
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: memoCategoryKeys.all(uid) });
        },
    });
};


