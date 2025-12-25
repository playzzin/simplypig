import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { YT_ROUTES } from "../constants";
import { useYtCategoriesQuery } from "../hooks/useYtCategories";
import { useYtVideosQuery } from "../hooks/useYtVideos";
import {
    useUpdateYtProgressMutation,
    useUpdateYtUserPrefsMutation,
    useUpdateYtVideoCompletedMutation,
    useUpdateYtVideoLoopMutation,
    useUpdateYtVideoPlayerOverrideMutation,
    useUpdateYtQueueMutation,
    useYtUserPrefsQuery,
} from "../hooks/useYtPrefs";
import { throttle } from "../lib/throttle";
import { useYoutubePlayer } from "../lib/youtubeIframeApi";
import type { YtPlayerPrefs } from "../types";

interface YtWatchPageProps {
    uid: string | null;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const YtWatchPage: React.FC<YtWatchPageProps> = ({ uid }) => {
    const navigate = useNavigate();
    const { videoDocId } = useParams<{ videoDocId: string }>();
    const categoriesQuery = useYtCategoriesQuery(uid);
    const videosQuery = useYtVideosQuery(uid);
    const prefsQuery = useYtUserPrefsQuery(uid);
    const updatePrefs = useUpdateYtUserPrefsMutation(uid);
    const updateVideoOverride = useUpdateYtVideoPlayerOverrideMutation(uid);
    const updateProgress = useUpdateYtProgressMutation(uid);
    const updateLoop = useUpdateYtVideoLoopMutation(uid);
    const updateCompleted = useUpdateYtVideoCompletedMutation(uid);
    const updateQueue = useUpdateYtQueueMutation(uid);

    const categories = categoriesQuery.data ?? [];
    const videos = videosQuery.data ?? [];

    const video = useMemo(() => videos.find((v) => v.id === videoDocId) ?? null, [videos, videoDocId]);
    const category = useMemo(() => categories.find((c) => c.id === video?.categoryId) ?? null, [categories, video?.categoryId]);

    const [resumeRequested, setResumeRequested] = useState(false);
    const [abEnabled, setAbEnabled] = useState(false);
    const [abA, setAbA] = useState<number | null>(null);
    const [abB, setAbB] = useState<number | null>(null);
    const lastSeekRef = useRef<number>(0);

    const playerHook = useYoutubePlayer({
        videoId: video?.videoId ?? null,
        autoplay: true,
        startSeconds: resumeRequested ? Math.floor(video?.progressSec ?? 0) : 0,
    });

    const prefs: YtPlayerPrefs | null = prefsQuery.data?.player ?? null;
    const [localPrefs, setLocalPrefs] = useState<YtPlayerPrefs>({ volume: 60, muted: false, playbackRate: 1, theaterMode: true });
    const [autoResume, setAutoResume] = useState(true);
    const [autoNext, setAutoNext] = useState(true);
    const [removeCompletedFromQueue, setRemoveCompletedFromQueue] = useState(true);
    const [usePerVideoPrefs, setUsePerVideoPrefs] = useState(false);

    useEffect(() => {
        if (!prefsQuery.data) return;
        setAutoResume(prefsQuery.data.autoResume);
        setAutoNext(prefsQuery.data.autoNext);
        setRemoveCompletedFromQueue(prefsQuery.data.removeCompletedFromQueue);
        // 영상별 override가 없고, 아직 per-video 모드가 아니면 전역 설정을 기준값으로 유지
        if (!usePerVideoPrefs) setLocalPrefs(prefsQuery.data.player);
    }, [prefsQuery.data, usePerVideoPrefs]);

    // auto-resume: 진행률이 있으면 자동으로 이어보기 활성화
    useEffect(() => {
        if (!video) return;
        if (!autoResume) return;
        if (video.progressSec <= 5) return;
        setResumeRequested(true);
    }, [autoResume, video]);

    // 영상별 설정이 있으면 기본으로 적용(사용자 선택으로 끌 수 있음)
    useEffect(() => {
        if (!video) return;
        if (video.playerOverride) {
            setUsePerVideoPrefs(true);
            setLocalPrefs(video.playerOverride);
        } else {
            setUsePerVideoPrefs(false);
        }
    }, [video?.id]);

    // 저장된 A/B 루프 복원
    useEffect(() => {
        if (!video) return;
        setAbA(video.loopA);
        setAbB(video.loopB);
        setAbEnabled(video.loopEnabled);
    }, [video?.id, video?.loopA, video?.loopB, video?.loopEnabled]);

    // 플레이어 준비 후 전역 설정 적용
    useEffect(() => {
        const p = playerHook.player;
        if (!playerHook.isReady || !p) return;

        try {
            p.setVolume(clamp(localPrefs.volume, 0, 100));
            if (localPrefs.muted) p.mute();
            else p.unMute();
            p.setPlaybackRate(clamp(localPrefs.playbackRate, 0.25, 2));
        } catch {
            // ignore
        }
    }, [localPrefs.muted, localPrefs.playbackRate, localPrefs.volume, playerHook.isReady, playerHook.player]);

    // 진행률 저장(호스팅/비용/성능 안정: 5초 throttle)
    const throttledSave = useMemo(
        () =>
            throttle((seconds: number) => {
                if (!uid || !videoDocId) return;
                const duration = playerHook.duration > 0 ? Math.floor(playerHook.duration) : null;
                const shouldPersistDuration = Boolean(video && (video.durationSec === null || video.durationSec === undefined) && duration && duration > 0);
                void updateProgress.mutateAsync({
                    videoDocId,
                    progressSec: Math.floor(seconds),
                    durationSec: shouldPersistDuration ? duration : undefined,
                });
            }, 5000),
        [playerHook.duration, uid, updateProgress, video, videoDocId]
    );

    useEffect(() => {
        if (!uid || !videoDocId) return;
        if (!playerHook.isReady) return;
        if (!playerHook.player) return;
        if (!video) return;

        const seconds = playerHook.currentTime;
        if (seconds <= 0) return;
        throttledSave(seconds);
    }, [playerHook.currentTime, playerHook.isReady, playerHook.player, throttledSave, uid, video, videoDocId]);

    const onToggleMute = async () => {
        const next = { ...localPrefs, muted: !localPrefs.muted };
        setLocalPrefs(next);
        try {
            if (usePerVideoPrefs && videoDocId) {
                await updateVideoOverride.mutateAsync({ videoDocId, playerOverride: next });
            } else {
                await updatePrefs.mutateAsync({ player: next, autoResume, autoNext, removeCompletedFromQueue });
                // removeCompletedFromQueue는 유지
            }
        } catch {
            // toast는 mutation 레벨에서 처리해도 되지만, 여기선 조용히 실패해도 로컬은 유지
        }
    };

    const onVolumeChange = async (v: number) => {
        const next = { ...localPrefs, volume: clamp(v, 0, 100), muted: v === 0 ? true : localPrefs.muted };
        setLocalPrefs(next);
        try {
            if (usePerVideoPrefs && videoDocId) {
                await updateVideoOverride.mutateAsync({ videoDocId, playerOverride: next });
            } else {
                await updatePrefs.mutateAsync({ player: next, autoResume, autoNext, removeCompletedFromQueue });
            }
        } catch {
            // ignore
        }
    };

    const onRateChange = async (rate: number) => {
        const next = { ...localPrefs, playbackRate: clamp(rate, 0.25, 2) };
        setLocalPrefs(next);
        try {
            if (usePerVideoPrefs && videoDocId) {
                await updateVideoOverride.mutateAsync({ videoDocId, playerOverride: next });
            } else {
                await updatePrefs.mutateAsync({ player: next, autoResume, autoNext, removeCompletedFromQueue });
            }
        } catch {
            // ignore
        }
    };

    const onToggleTheater = async () => {
        const next = { ...localPrefs, theaterMode: !localPrefs.theaterMode };
        setLocalPrefs(next);
        try {
            if (usePerVideoPrefs && videoDocId) {
                await updateVideoOverride.mutateAsync({ videoDocId, playerOverride: next });
            } else {
                await updatePrefs.mutateAsync({ player: next, autoResume, autoNext, removeCompletedFromQueue });
            }
        } catch {
            // ignore
        }
    };

    const onToggleAutoResume = async () => {
        const nextAuto = !autoResume;
        setAutoResume(nextAuto);
        try {
            await updatePrefs.mutateAsync({
                player: prefs ?? localPrefs,
                autoResume: nextAuto,
                autoNext,
                removeCompletedFromQueue,
            });
        } catch {
            // ignore
        }
    };

    const onToggleAutoNext = async () => {
        const next = !autoNext;
        setAutoNext(next);
        try {
            await updatePrefs.mutateAsync({
                player: prefs ?? localPrefs,
                autoResume,
                autoNext: next,
                removeCompletedFromQueue,
            });
        } catch {
            // ignore
        }
    };

    const onToggleRemoveCompletedFromQueue = async () => {
        const next = !removeCompletedFromQueue;
        setRemoveCompletedFromQueue(next);
        try {
            await updatePrefs.mutateAsync({
                player: prefs ?? localPrefs,
                autoResume,
                autoNext,
                removeCompletedFromQueue: next,
            });
        } catch {
            // ignore
        }
    };

    const onTogglePerVideoPrefs = async () => {
        if (!videoDocId) return;
        const next = !usePerVideoPrefs;
        setUsePerVideoPrefs(next);
        try {
            if (next) {
                await updateVideoOverride.mutateAsync({ videoDocId, playerOverride: localPrefs });
            } else {
                await updateVideoOverride.mutateAsync({ videoDocId, playerOverride: null });
                if (prefs) setLocalPrefs(prefs);
            }
        } catch {
            // ignore
        }
    };

    const seekBy = (delta: number) => {
        const p = playerHook.player;
        if (!p) return;
        const now = p.getCurrentTime();
        const d = p.getDuration();
        const next = clamp(now + delta, 0, d > 0 ? d : now + delta);
        p.seekTo(next, true);
    };

    const setPointA = () => {
        const nextA = Math.floor(playerHook.currentTime);
        setAbA(nextA);
        void persistLoop({ loopA: nextA, loopB: abB, loopEnabled: abEnabled });
    };
    const setPointB = () => {
        const nextB = Math.floor(playerHook.currentTime);
        setAbB(nextB);
        void persistLoop({ loopA: abA, loopB: nextB, loopEnabled: abEnabled });
    };

    const canLoop = abA !== null && abB !== null && abB > abA + 1;

    const persistLoop = async (next: { loopA: number | null; loopB: number | null; loopEnabled: boolean }) => {
        if (!videoDocId) return;
        try {
            await updateLoop.mutateAsync({ videoDocId, ...next });
        } catch {
            // ignore
        }
    };

    // A-B loop 실행: 250ms로 체크(호스팅 부담 없음, client-only)
    useEffect(() => {
        if (!abEnabled) return;
        if (!canLoop) return;
        const p = playerHook.player;
        if (!p) return;

        const id = window.setInterval(() => {
            const cur = p.getCurrentTime();
            if (cur >= (abB ?? 0)) {
                const now = Date.now();
                // seek 폭주 방지(연속 이벤트)
                if (now - lastSeekRef.current > 400) {
                    lastSeekRef.current = now;
                    p.seekTo(abA ?? 0, true);
                }
            }
        }, 250);
        return () => window.clearInterval(id);
    }, [abA, abB, abEnabled, canLoop, playerHook.player]);

    // 단축키: 입력 요소에서는 무시
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
            if (!playerHook.player) return;

            if (e.key === " " || e.code === "Space") {
                e.preventDefault();
                const state = playerHook.player.getPlayerState();
                if (state === 1) playerHook.player.pauseVideo();
                else playerHook.player.playVideo();
                return;
            }
            if (e.key.toLowerCase() === "m") {
                e.preventDefault();
                void onToggleMute();
                return;
            }
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                seekBy(e.shiftKey ? -15 : -5);
                return;
            }
            if (e.key === "ArrowRight") {
                e.preventDefault();
                seekBy(e.shiftKey ? 15 : 5);
                return;
            }
            if (e.key === "+" || e.key === "=") {
                e.preventDefault();
                const next = clamp(localPrefs.playbackRate + 0.25, 0.25, 2);
                void onRateChange(next);
                return;
            }
            if (e.key === "-" || e.key === "_") {
                e.preventDefault();
                const next = clamp(localPrefs.playbackRate - 0.25, 0.25, 2);
                void onRateChange(next);
                return;
            }
            if (e.key.toLowerCase() === "a") {
                e.preventDefault();
                setPointA();
                return;
            }
            if (e.key.toLowerCase() === "b") {
                e.preventDefault();
                setPointB();
                return;
            }
            if (e.key.toLowerCase() === "l") {
                e.preventDefault();
                if (canLoop) setAbEnabled((prev) => !prev);
                return;
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [canLoop, localPrefs.playbackRate, onToggleMute, onRateChange, playerHook.player]);

    const queue = prefsQuery.data?.queue ?? [];
    const queueIndex = useMemo(() => (videoDocId ? queue.indexOf(videoDocId) : -1), [queue, videoDocId]);
    const nextId = useMemo(() => {
        if (queue.length === 0) return null;
        if (queueIndex >= 0 && queueIndex + 1 < queue.length) return queue[queueIndex + 1] ?? null;
        if (queueIndex === -1) return queue[0] ?? null;
        return null;
    }, [queue, queueIndex]);
    const prevId = useMemo(() => {
        if (queue.length === 0) return null;
        if (queueIndex > 0) return queue[queueIndex - 1] ?? null;
        return null;
    }, [queue, queueIndex]);

    const nextVideoTitle = useMemo(() => {
        if (!nextId) return null;
        const v = videos.find((x) => x.id === nextId) ?? null;
        return v?.title ?? null;
    }, [nextId, videos]);

    const lastAutoNextRef = useRef<string | null>(null);
    useEffect(() => {
        if (!autoNext) return;
        if (!videoDocId) return;
        if (playerHook.state !== 0) return; // ended
        if (!nextId) return;
        if (lastAutoNextRef.current === videoDocId) return;
        lastAutoNextRef.current = videoDocId;
        // 자동 다음: ended 시점 1회만 처리(완료 처리 + 옵션이면 큐에서 제거) 후 이동
        void (async () => {
            try {
                if (uid && videoDocId) {
                    await updateCompleted.mutateAsync({ videoDocId, completed: true });
                }
                if (uid && prefsQuery.data && removeCompletedFromQueue && queueIndex >= 0) {
                    const nextQueue = prefsQuery.data.queue.filter((id) => id !== videoDocId);
                    await updateQueue.mutateAsync(nextQueue);
                }
            } catch {
                // ignore
            } finally {
                navigate(`/yt/watch/${nextId}`);
            }
        })();
    }, [autoNext, navigate, nextId, playerHook.state, prefsQuery.data, queueIndex, removeCompletedFromQueue, updateCompleted, updateQueue, uid, videoDocId]);

    if (!videoDocId) {
        return (
            <main className="main-content">
                <div className="card glass space-y-3">
                    <h2 className="view-title">유튜브 재생</h2>
                    <p className="lead">잘못된 주소입니다.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="main-content">
            <div className="card glass space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="view-title">유튜브 재생</h2>
                        <p className="lead truncate">{video?.title ?? "로딩 중…"}</p>
                        {category && (
                            <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ background: category.colorHex }} aria-hidden />
                                <span>{category.name}</span>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                        onClick={() => navigate(YT_ROUTES.library)}
                    >
                        목록으로
                    </button>
                </div>

                {!video && (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                        영상을 찾는 중입니다…
                    </div>
                )}

                {video && (
                    <div className={localPrefs.theaterMode ? "space-y-3" : "space-y-3 max-w-[780px]"}>
                        {video.progressSec > 5 && !resumeRequested && (
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                                <span>이전 시청 위치가 있어요: {Math.floor(video.progressSec)}초</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                                        onClick={() => setResumeRequested(true)}
                                    >
                                        이어보기
                                    </button>
                                    <button
                                        type="button"
                                        className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                                        onClick={() => {
                                            setResumeRequested(false);
                                            if (playerHook.player) playerHook.player.seekTo(0, true);
                                        }}
                                    >
                                        처음부터
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
                            <div ref={playerHook.containerRef} className="h-full w-full" />
                        </div>

                        {(playerHook.error || prefsQuery.error) && (
                            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                                플레이어를 불러오지 못했습니다. 네트워크/차단 상태를 확인해 주세요.
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <div className="flex items-center gap-3">
                                <button type="button" className="btn-icon" aria-label="음소거 토글" onClick={() => void onToggleMute()}>
                                    {localPrefs.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                </button>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-300">볼륨</span>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={localPrefs.volume}
                                        onChange={(e) => void onVolumeChange(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-300">속도</span>
                                <select
                                    className="h-9 rounded-xl border border-white/10 bg-slate-950/35 px-3 text-xs font-semibold text-slate-100 outline-none"
                                    value={localPrefs.playbackRate}
                                    onChange={(e) => void onRateChange(Number(e.target.value))}
                                >
                                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((r) => (
                                        <option key={r} value={r}>
                                            {r}x
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                                    onClick={() => void onToggleTheater()}
                                >
                                    {localPrefs.theaterMode ? "Theater" : "Compact"}
                                </button>
                            </div>

                            <div className="text-xs text-slate-300">
                                {Math.floor(playerHook.currentTime)}s / {Math.floor(playerHook.duration)}s
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <div className="flex items-center gap-2 text-xs text-slate-200">
                                <label className="inline-flex items-center gap-2">
                                    <input type="checkbox" checked={autoResume} onChange={() => void onToggleAutoResume()} />
                                    <span>자동 이어보기</span>
                                </label>
                                <label className="inline-flex items-center gap-2">
                                    <input type="checkbox" checked={autoNext} onChange={() => void onToggleAutoNext()} />
                                    <span>자동 다음</span>
                                </label>
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={removeCompletedFromQueue}
                                        onChange={() => void onToggleRemoveCompletedFromQueue()}
                                    />
                                    <span>완료 시 큐에서 제거</span>
                                </label>
                                <label className="inline-flex items-center gap-2">
                                    <input type="checkbox" checked={usePerVideoPrefs} onChange={() => void onTogglePerVideoPrefs()} />
                                    <span>이 영상에만 설정 적용</span>
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="btn-icon"
                                    aria-label="이전"
                                    onClick={() => prevId && navigate(`/yt/watch/${prevId}`)}
                                    disabled={!prevId}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    type="button"
                                    className="btn-icon"
                                    aria-label="다음"
                                    onClick={() => nextId && navigate(`/yt/watch/${nextId}`)}
                                    disabled={!nextId}
                                >
                                    <ChevronRight size={18} />
                                </button>
                                <div className="text-xs text-slate-400">
                                    Up next: {nextVideoTitle ?? "없음"}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                                    onClick={setPointA}
                                >
                                    A 설정
                                </button>
                                <button
                                    type="button"
                                    className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                                    onClick={setPointB}
                                >
                                    B 설정
                                </button>
                                <button
                                    type="button"
                                    className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                                    onClick={() => {
                                        const nextEnabled = !abEnabled;
                                        setAbEnabled(nextEnabled);
                                        void persistLoop({ loopA: abA, loopB: abB, loopEnabled: nextEnabled });
                                    }}
                                    disabled={!canLoop}
                                >
                                    {abEnabled ? "루프 끄기" : "A-B 루프"}
                                </button>
                                <button
                                    type="button"
                                    className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                                    onClick={() => {
                                        setAbEnabled(false);
                                        setAbA(null);
                                        setAbB(null);
                                        void persistLoop({ loopA: null, loopB: null, loopEnabled: false });
                                    }}
                                >
                                    초기화
                                </button>
                                <button
                                    type="button"
                                    className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                                    onClick={() => {
                                        if (!videoDocId || !video) return;
                                        void updateCompleted.mutateAsync({ videoDocId, completed: !video.completed });
                                    }}
                                >
                                    {video?.completed ? "완료 취소" : "다 봄"}
                                </button>
                                <div className="text-xs text-slate-400">
                                    단축키: Space(재생) / ←→(시크) / M(음소거) / +/- (속도) / A,B, L(루프)
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <div className="flex items-center justify-between text-xs text-slate-300">
                                <span>진행률</span>
                                <span>{Math.floor(playerHook.currentTime)}s / {Math.floor(playerHook.duration)}s</span>
                            </div>
                            <input
                                className="mt-2 w-full"
                                type="range"
                                min={0}
                                max={Math.max(1, Math.floor(playerHook.duration))}
                                value={Math.floor(playerHook.currentTime)}
                                onChange={(e) => {
                                    const p = playerHook.player;
                                    if (!p) return;
                                    const next = Number(e.target.value);
                                    p.seekTo(next, true);
                                }}
                                disabled={!playerHook.isReady || playerHook.duration <= 0}
                                aria-label="진행률"
                            />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};


