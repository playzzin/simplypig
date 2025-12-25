import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createYtCategory, deleteYtCategory, listYtCategories, updateYtCategory } from "../api/firestore";
import { ytCategoryCreateSchema, ytCategoryUpdateSchema } from "../schemas";
import type { YtCategory, YtCategoryCreateInput } from "../types";

const ytCategoryKeys = {
    all: (uid: string) => ["ytCategories", uid] as const,
};

export const useYtCategoriesQuery = (uid: string | null) => {
    return useQuery<YtCategory[]>({
        queryKey: uid ? ytCategoryKeys.all(uid) : ["ytCategories", "no-user"],
        enabled: Boolean(uid),
        queryFn: async () => {
            if (!uid) return [];
            return await listYtCategories(uid);
        },
        staleTime: 20_000,
    });
};

export const useCreateYtCategoryMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: YtCategoryCreateInput) => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            const validated = ytCategoryCreateSchema.parse(input);
            return await createYtCategory(uid, validated);
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: ytCategoryKeys.all(uid) });
        },
    });
};

export const useDeleteYtCategoryMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (categoryId: string) => {
            await deleteYtCategory(categoryId);
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: ytCategoryKeys.all(uid) });
        },
    });
};

export const useUpdateYtCategoryMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { categoryId: string; name: string; colorHex: string }) => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            const validated = ytCategoryUpdateSchema.parse({ name: payload.name, colorHex: payload.colorHex });
            await updateYtCategory(uid, payload.categoryId, validated);
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: ytCategoryKeys.all(uid) });
        },
    });
};


