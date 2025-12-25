import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getYtUserPrefs,
    setYtUserPrefs,
    setYtUserQueue,
    updateYtVideoCompleted,
    updateYtVideoLoop,
    updateYtVideoPlayerOverride,
    updateYtVideoProgress,
} from "../api/firestore";
import { ytPlayerPrefsSchema } from "../schemas";
import type { YtPlayerPrefs, YtUserPrefs } from "../types";

const ytPrefsKeys = {
    user: (uid: string) => ["ytUserPrefs", uid] as const,
    videos: (uid: string) => ["ytVideos", uid] as const,
};

export const useYtUserPrefsQuery = (uid: string | null) => {
    return useQuery<YtUserPrefs>({
        queryKey: uid ? ytPrefsKeys.user(uid) : ["ytUserPrefs", "no-user"],
        enabled: Boolean(uid),
        queryFn: async () => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            return await getYtUserPrefs(uid);
        },
        staleTime: 30_000,
    });
};

export const useUpdateYtUserPrefsMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (next: { player: YtPlayerPrefs; autoResume: boolean; autoNext: boolean; removeCompletedFromQueue: boolean }) => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            const validatedPlayer = ytPlayerPrefsSchema.parse(next.player);
            await setYtUserPrefs(uid, {
                player: validatedPlayer,
                autoResume: next.autoResume,
                autoNext: next.autoNext,
                removeCompletedFromQueue: next.removeCompletedFromQueue,
            });
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: ytPrefsKeys.user(uid) });
        },
    });
};

export const useUpdateYtQueueMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (queue: string[]) => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            await setYtUserQueue(uid, queue);
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: ytPrefsKeys.user(uid) });
        },
    });
};

export const useUpdateYtProgressMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { videoDocId: string; progressSec: number; durationSec?: number | null }) => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            await updateYtVideoProgress(uid, payload.videoDocId, { progressSec: payload.progressSec, durationSec: payload.durationSec });
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: ytPrefsKeys.videos(uid) });
        },
    });
};

export const useUpdateYtVideoPlayerOverrideMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { videoDocId: string; playerOverride: YtPlayerPrefs | null }) => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            const validated = payload.playerOverride ? ytPlayerPrefsSchema.parse(payload.playerOverride) : null;
            await updateYtVideoPlayerOverride(uid, payload.videoDocId, validated);
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: ytPrefsKeys.videos(uid) });
        },
    });
};

export const useUpdateYtVideoLoopMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { videoDocId: string; loopA: number | null; loopB: number | null; loopEnabled: boolean }) => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            await updateYtVideoLoop(uid, payload.videoDocId, { loopA: payload.loopA, loopB: payload.loopB, loopEnabled: payload.loopEnabled });
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: ytPrefsKeys.videos(uid) });
        },
    });
};

export const useUpdateYtVideoCompletedMutation = (uid: string | null) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { videoDocId: string; completed: boolean }) => {
            if (!uid) throw new Error("로그인이 필요합니다.");
            await updateYtVideoCompleted(uid, payload.videoDocId, payload.completed);
        },
        onSuccess: async () => {
            if (!uid) return;
            await queryClient.invalidateQueries({ queryKey: ytPrefsKeys.videos(uid) });
        },
    });
};


