import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { YT_ROUTES, buildYtWatchRoute } from "../constants";
import { useYtVideosQuery } from "../hooks/useYtVideos";
import { useUpdateYtQueueMutation, useYtUserPrefsQuery } from "../hooks/useYtPrefs";

interface YtQueuePageProps {
    uid: string | null;
}

export const YtQueuePage: React.FC<YtQueuePageProps> = ({ uid }) => {
    const navigate = useNavigate();
    const prefsQuery = useYtUserPrefsQuery(uid);
    const updateQueue = useUpdateYtQueueMutation(uid);
    const videosQuery = useYtVideosQuery(uid);

    const queue = prefsQuery.data?.queue ?? [];
    const videos = videosQuery.data ?? [];
    const videoById = useMemo(() => new Map(videos.map((v) => [v.id, v])), [videos]);

    const move = async (from: number, to: number) => {
        try {
            if (!uid) throw new Error("로그인이 필요합니다.");
            if (from < 0 || to < 0 || from >= queue.length || to >= queue.length) return;
            const next = [...queue];
            const [item] = next.splice(from, 1);
            next.splice(to, 0, item!);
            await updateQueue.mutateAsync(next);
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("큐 변경 중 오류가 발생했습니다.");
        }
    };

    const remove = async (idx: number) => {
        try {
            if (!uid) throw new Error("로그인이 필요합니다.");
            const next = queue.filter((_, i) => i !== idx);
            await updateQueue.mutateAsync(next);
            toast.success("큐에서 제거했어요.");
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("삭제 중 오류가 발생했습니다.");
        }
    };

    const clear = async () => {
        try {
            if (!uid) throw new Error("로그인이 필요합니다.");
            await updateQueue.mutateAsync([]);
            toast.success("큐를 비웠어요.");
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("큐 초기화 중 오류가 발생했습니다.");
        }
    };

    return (
        <main className="main-content">
            <div className="card glass space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="view-title">유튜브 큐</h2>
                        <p className="lead">순서를 바꾸고, 필요한 것만 남겨서 연속 시청하세요.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                            onClick={() => navigate(YT_ROUTES.library)}
                        >
                            라이브러리
                        </button>
                        <button
                            type="button"
                            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                            onClick={() => void clear()}
                            disabled={!uid || queue.length === 0 || updateQueue.isPending}
                        >
                            비우기
                        </button>
                    </div>
                </div>

                {!uid && (
                    <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        Firebase 인증 준비 중입니다. 잠시만 기다려 주세요.
                    </div>
                )}

                {(prefsQuery.isLoading || videosQuery.isLoading) && (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">로딩 중…</div>
                )}

                {(prefsQuery.error || videosQuery.error) && (
                    <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                        데이터를 불러오지 못했습니다. Firebase 설정/권한을 확인해 주세요.
                    </div>
                )}

                {!prefsQuery.isLoading && queue.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                        큐가 비어있어요. 라이브러리에서 “큐에 추가”를 눌러 보세요.
                    </div>
                )}

                <div className="space-y-2">
                    {queue.map((id, idx) => {
                        const v = videoById.get(id) ?? null;
                        return (
                            <div key={`${id}_${idx}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                                <div className="min-w-0">
                                    <div className="text-xs font-semibold text-slate-400">#{idx + 1}</div>
                                    <button
                                        type="button"
                                        className="mt-1 text-left text-sm font-bold text-slate-100 underline decoration-white/15 underline-offset-4 hover:decoration-white/40"
                                        onClick={() => navigate(buildYtWatchRoute(id))}
                                    >
                                        {v?.title ?? "(영상 정보 없음 - 삭제되었을 수 있어요)"}
                                    </button>
                                    {v?.channelName && <div className="mt-1 text-xs text-slate-300">{v.channelName}</div>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" className="btn-icon" aria-label="위로" onClick={() => void move(idx, idx - 1)} disabled={idx === 0 || updateQueue.isPending}>
                                        <ArrowUp size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-icon"
                                        aria-label="아래로"
                                        onClick={() => void move(idx, idx + 1)}
                                        disabled={idx === queue.length - 1 || updateQueue.isPending}
                                    >
                                        <ArrowDown size={16} />
                                    </button>
                                    <button type="button" className="btn-icon" aria-label="제거" onClick={() => void remove(idx)} disabled={updateQueue.isPending}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
};


