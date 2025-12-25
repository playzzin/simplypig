import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ExternalLink, ListPlus, Pencil, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { YT_ROUTES, buildYtEditRoute, buildYtWatchRoute } from "../constants";
import { useYtCategoriesQuery } from "../hooks/useYtCategories";
import { useDeleteYtVideoMutation, useUpdateYtVideoNoteMutation, useYtVideosQuery } from "../hooks/useYtVideos";
import { useUpdateYtQueueMutation, useYtUserPrefsQuery } from "../hooks/useYtPrefs";

interface YtLibraryPageProps {
    uid: string | null;
}

const buildEmbedUrl = (videoId: string): string =>
    `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

export const YtLibraryPage: React.FC<YtLibraryPageProps> = ({ uid }) => {
    const navigate = useNavigate();
    const categoriesQuery = useYtCategoriesQuery(uid);
    const videosQuery = useYtVideosQuery(uid);
    const prefsQuery = useYtUserPrefsQuery(uid);
    const updateQueue = useUpdateYtQueueMutation(uid);
    const deleteVideo = useDeleteYtVideoMutation(uid);
    const updateNote = useUpdateYtVideoNoteMutation(uid);

    const categories = categoriesQuery.data ?? [];
    const videos = videosQuery.data ?? [];
    const queue = prefsQuery.data?.queue ?? [];
    const queueSet = useMemo(() => new Set(queue), [queue]);

    const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

    // 호스팅/성능 최적화: 목록에서 iframe은 "한 번에 1개만" 열기
    const [activePlayId, setActivePlayId] = useState<string | null>(null);
    const [noteDraftById, setNoteDraftById] = useState<Record<string, string>>({});

    type StatusFilter = "all" | "unwatched" | "inprogress" | "completed";
    type QueueFilter = "all" | "inQueue" | "notInQueue";
    type SortKey = "recentAdded" | "recentWatched" | "title" | "progress";

    const [search, setSearch] = useState("");
    const [categoryFilterId, setCategoryFilterId] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [queueFilter, setQueueFilter] = useState<QueueFilter>("all");
    const [sortKey, setSortKey] = useState<SortKey>("recentAdded");

    const normalizedSearch = useMemo(() => search.trim().toLowerCase(), [search]);

    const filteredVideos = useMemo(() => {
        const base = videos;

        const bySearch = normalizedSearch.length
            ? base.filter((v) => {
                  const hay = `${v.title} ${v.channelName ?? ""} ${v.note}`.toLowerCase();
                  return hay.includes(normalizedSearch);
              })
            : base;

        const byCategory =
            categoryFilterId === "all" ? bySearch : bySearch.filter((v) => v.categoryId === categoryFilterId);

        const byQueue =
            queueFilter === "all"
                ? byCategory
                : queueFilter === "inQueue"
                  ? byCategory.filter((v) => queueSet.has(v.id))
                  : byCategory.filter((v) => !queueSet.has(v.id));

        const byStatus =
            statusFilter === "all"
                ? byQueue
                : statusFilter === "completed"
                  ? byQueue.filter((v) => v.completed)
                  : statusFilter === "unwatched"
                    ? byQueue.filter((v) => !v.completed && v.progressSec <= 0)
                    : byQueue.filter((v) => !v.completed && v.progressSec > 0);

        const progressRatio = (v: (typeof videos)[number]): number => {
            if (v.durationSec && v.durationSec > 0) return v.progressSec / v.durationSec;
            if (v.progressSec > 0) return 0.01; // duration 미확보 시 진행중만 최소 가중치
            return 0;
        };

        const sorted = [...byStatus].sort((a, b) => {
            if (sortKey === "recentAdded") return b.createdAt.getTime() - a.createdAt.getTime();
            if (sortKey === "recentWatched") return (b.lastWatchedAt?.getTime() ?? 0) - (a.lastWatchedAt?.getTime() ?? 0);
            if (sortKey === "title") return a.title.localeCompare(b.title, "ko");
            return progressRatio(b) - progressRatio(a);
        });

        return sorted;
    }, [categoryFilterId, normalizedSearch, queueFilter, queueSet, sortKey, statusFilter, videos]);

    const resetFilters = () => {
        setSearch("");
        setCategoryFilterId("all");
        setStatusFilter("all");
        setQueueFilter("all");
        setSortKey("recentAdded");
    };

    const onTogglePlay = (id: string) => setActivePlayId((prev) => (prev === id ? null : id));

    const onSaveNote = async (videoDocId: string) => {
        try {
            const next = noteDraftById[videoDocId] ?? "";
            await updateNote.mutateAsync({ videoDocId, note: next });
            toast.success("메모를 저장했어요.");
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("저장 중 오류가 발생했습니다.");
        }
    };

    const onDelete = async (videoDocId: string) => {
        try {
            await deleteVideo.mutateAsync(videoDocId);
            toast.success("삭제했어요.");
            setActivePlayId((prev) => (prev === videoDocId ? null : prev));
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("삭제 중 오류가 발생했습니다.");
        }
    };

    const addToQueue = async (videoDocId: string) => {
        try {
            if (!uid) throw new Error("로그인이 필요합니다.");
            if (queueSet.has(videoDocId)) return;
            const v = videos.find((it) => it.id === videoDocId) ?? null;
            if (v?.platform !== "youtube") {
                toast.error("현재 큐/연속시청은 YouTube만 지원합니다.");
                return;
            }
            const next = [...queue, videoDocId];
            await updateQueue.mutateAsync(next);
            toast.success("큐에 추가했어요.");
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("큐 추가 중 오류가 발생했습니다.");
        }
    };

    const clearQueue = async () => {
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
                        <h2 className="view-title">유튜브 라이브러리</h2>
                        <p className="lead">썸네일로 빠르게 찾고, 카드에서 바로 재생합니다. (한 번에 1개만 로드)</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                            onClick={() => void clearQueue()}
                            disabled={!uid || queue.length === 0 || updateQueue.isPending}
                        >
                            큐 비우기 ({queue.length})
                        </button>
                        <button
                            type="button"
                            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                            onClick={() => navigate(YT_ROUTES.categories)}
                        >
                            카테고리
                        </button>
                        <button
                            type="button"
                            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                            onClick={() => navigate(YT_ROUTES.queue)}
                        >
                            큐 관리
                        </button>
                        <button
                            type="button"
                            className="h-10 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
                            onClick={() => navigate(YT_ROUTES.add)}
                        >
                            추가
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-[240px] flex-1 items-center gap-2">
                            <input
                                className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 text-sm text-slate-100 outline-none"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="검색: 제목/채널/메모"
                                aria-label="검색"
                            />
                            <button
                                type="button"
                                className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                                onClick={resetFilters}
                            >
                                초기화
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                className="h-10 rounded-xl border border-white/10 bg-slate-950/35 px-3 text-sm font-semibold text-slate-100 outline-none"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                aria-label="상태 필터"
                            >
                                <option value="all">상태: 전체</option>
                                <option value="unwatched">상태: 미시청</option>
                                <option value="inprogress">상태: 진행중</option>
                                <option value="completed">상태: 완료</option>
                            </select>
                            <select
                                className="h-10 rounded-xl border border-white/10 bg-slate-950/35 px-3 text-sm font-semibold text-slate-100 outline-none"
                                value={queueFilter}
                                onChange={(e) => setQueueFilter(e.target.value as QueueFilter)}
                                aria-label="큐 필터"
                            >
                                <option value="all">큐: 전체</option>
                                <option value="inQueue">큐: 큐만</option>
                                <option value="notInQueue">큐: 큐 제외</option>
                            </select>
                            <select
                                className="h-10 rounded-xl border border-white/10 bg-slate-950/35 px-3 text-sm font-semibold text-slate-100 outline-none"
                                value={sortKey}
                                onChange={(e) => setSortKey(e.target.value as SortKey)}
                                aria-label="정렬"
                            >
                                <option value="recentAdded">정렬: 최근 추가</option>
                                <option value="recentWatched">정렬: 최근 시청</option>
                                <option value="title">정렬: 제목</option>
                                <option value="progress">정렬: 진행률</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            className={`h-9 rounded-xl border px-3 text-xs font-semibold transition ${
                                categoryFilterId === "all"
                                    ? "border-emerald-300/60 bg-emerald-500/10 text-emerald-100"
                                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                            }`}
                            onClick={() => setCategoryFilterId("all")}
                        >
                            전체
                        </button>
                        {categories.map((c) => {
                            const selected = c.id === categoryFilterId;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    className={`h-9 rounded-xl border px-3 text-xs font-semibold transition ${
                                        selected
                                            ? "border-emerald-300/60 bg-emerald-500/10 text-emerald-100"
                                            : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                                    }`}
                                    onClick={() => setCategoryFilterId(c.id)}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.colorHex }} aria-hidden />
                                        <span>{c.name}</span>
                                    </span>
                                </button>
                            );
                        })}
                        <div className="ml-auto text-xs text-slate-300">결과: {filteredVideos.length}개</div>
                    </div>
                </div>

                {!uid && (
                    <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        Firebase 인증 준비 중입니다. 잠시만 기다려 주세요.
                    </div>
                )}

                {(categoriesQuery.isLoading || videosQuery.isLoading) && (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">로딩 중…</div>
                )}

                {(categoriesQuery.error || videosQuery.error) && (
                    <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                        데이터를 불러오지 못했습니다. Firebase 설정/권한을 확인해 주세요.
                    </div>
                )}

                {uid && !videosQuery.isLoading && videos.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                        아직 저장된 영상이 없어요. “추가”에서 유튜브 주소를 붙여넣어 보세요.
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {filteredVideos.map((v) => {
                        const cat = categoryById.get(v.categoryId) ?? null;
                        const tone = cat?.colorHex ?? "#94A3B8";
                        const isPlaying = activePlayId === v.id;
                        const noteDraft = noteDraftById[v.id] ?? v.note;
                        const isYoutube = v.platform === "youtube";

                        return (
                            <div
                                key={v.id}
                                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                                style={{ boxShadow: `inset 0 0 0 2px ${tone}22` }}
                            >
                                <button
                                    type="button"
                                    className="relative block w-full text-left"
                                    onClick={() => {
                                        if (isYoutube) onTogglePlay(v.id);
                                        else window.open(v.url, "_blank", "noreferrer");
                                    }}
                                    aria-label={isYoutube ? (isPlaying ? "재생 닫기" : "카드에서 재생") : "틱톡 열기"}
                                >
                                    {v.thumbnailUrl ? (
                                        <img className="aspect-video w-full object-cover" src={v.thumbnailUrl} alt={v.title} loading="lazy" />
                                    ) : (
                                        <div className="aspect-video w-full bg-slate-950/30" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                    {/* progress bar (durationSec가 있을 때만 정확) */}
                                    <div className="absolute left-0 right-0 bottom-0 h-1 bg-black/30">
                                        <div
                                            className="h-1 bg-emerald-400/80"
                                            style={{
                                                width:
                                                    v.durationSec && v.durationSec > 0
                                                        ? `${Math.min(100, Math.max(0, (v.progressSec / v.durationSec) * 100))}%`
                                                        : "0%",
                                            }}
                                        />
                                    </div>
                                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2.5 w-2.5 rounded-full" style={{ background: tone }} aria-hidden />
                                                <span className="text-xs font-semibold text-slate-200/90">{cat?.name ?? "미지정"}</span>
                                                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                                                    {isYoutube ? "YT" : "TT"}
                                                </span>
                                                {v.completed && (
                                                    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-100">
                                                        <CheckCircle2 size={12} />
                                                        완료
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 line-clamp-2 text-sm font-bold text-white">{v.title}</div>
                                            <div className="mt-1 text-xs text-slate-200/80">{v.channelName ?? "채널 정보 없음"}</div>
                                        </div>
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white">
                                            {isYoutube ? <Play size={18} /> : <ExternalLink size={18} />}
                                        </span>
                                    </div>
                                </button>

                                {isPlaying && isYoutube && (
                                    <div className="p-3 space-y-3">
                                        <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black">
                                            <iframe
                                                className="h-full w-full"
                                                src={buildEmbedUrl(v.videoId)}
                                                title={v.title}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                referrerPolicy="strict-origin-when-cross-origin"
                                                allowFullScreen
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <label className="text-xs font-semibold text-slate-300">간단 메모</label>
                                            <textarea
                                                className="min-h-[84px] w-full resize-y rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-slate-100 outline-none"
                                                value={noteDraft}
                                                onChange={(e) => setNoteDraftById((prev) => ({ ...prev, [v.id]: e.target.value }))}
                                                placeholder="예) 1.5배속 / 05:10 핵심"
                                            />
                                            <div className="flex items-center justify-between gap-2">
                                                <button
                                                    type="button"
                                                    className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                                                    onClick={() => navigate(buildYtWatchRoute(v.id))}
                                                >
                                                    크게 보기
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                                                        onClick={() => void addToQueue(v.id)}
                                                        disabled={!uid || queueSet.has(v.id) || updateQueue.isPending}
                                                    >
                                                        <span className="inline-flex items-center gap-2">
                                                            <ListPlus size={14} />
                                                            큐에 추가
                                                        </span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="h-9 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/15 disabled:opacity-60"
                                                        onClick={() => void onSaveNote(v.id)}
                                                        disabled={updateNote.isPending}
                                                    >
                                                        메모 저장
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-icon"
                                                        aria-label="수정"
                                                        onClick={() => navigate(buildYtEditRoute(v.id))}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-icon"
                                                        aria-label="삭제"
                                                        onClick={() => void onDelete(v.id)}
                                                        disabled={deleteVideo.isPending}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
};


