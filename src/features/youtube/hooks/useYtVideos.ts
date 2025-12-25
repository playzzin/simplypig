import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createYtVideo, deleteYtVideo, listYtVideos, updateYtVideo, updateYtVideoNote } from "../api/firestore";
import { ytVideoCreateSchema, ytVideoUpdateSchema } from "../schemas";
import type { YtVideo, YtVideoCreateInput } from "../types";

const ytVideoKeys = {
    all: (uid: string) => ["ytVideos", uid] as const,
};

export const useYtVideosQuery = (uid: string | null) => {
    return useQuery<YtVideo[]>({
        queryKey: uid ? ytVideoKeys.all(uid) : ["ytVideos", "no-user"],
        enabled: Boolean(uid),
        queryFn: async () => {
            if (!uid) return [];
            return await listYtVideos(uid);
        },
        staleTime: 10_000,
    });
};

export const useCreateYtVideoMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: YtVideoCreateInput) => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            const validated = ytVideoCreateSchema.parse(input);
            return await createYtVideo(uid, validated);
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: ytVideoKeys.all(uid) });
        },
    });
};

export const useUpdateYtVideoNoteMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { videoDocId: string; note: string }) => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            await updateYtVideoNote(uid, payload.videoDocId, payload.note);
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: ytVideoKeys.all(uid) });
        },
    });
};

export const useDeleteYtVideoMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (videoDocId: string) => {
            await deleteYtVideo(videoDocId);
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: ytVideoKeys.all(uid) });
        },
    });
};

export const useUpdateYtVideoMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { videoDocId: string; title: string; categoryId: string; note: string }) => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            const validated = ytVideoUpdateSchema.parse({ title: payload.title, categoryId: payload.categoryId, note: payload.note });
            await updateYtVideo(uid, payload.videoDocId, validated);
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: ytVideoKeys.all(uid) });
        },
    });
};


