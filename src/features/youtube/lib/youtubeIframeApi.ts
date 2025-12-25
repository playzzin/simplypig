import { useEffect, useMemo, useRef, useState } from "react";

type YtPlayerState = -1 | 0 | 1 | 2 | 3 | 5;

interface YtPlayer {
    destroy: () => void;
    playVideo: () => void;
    pauseVideo: () => void;
    stopVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    getCurrentTime: () => number;
    getDuration: () => number;
    setVolume: (volume: number) => void;
    getVolume: () => number;
    mute: () => void;
    unMute: () => void;
    isMuted: () => boolean;
    setPlaybackRate: (rate: number) => void;
    getPlaybackRate: () => number;
    getPlayerState: () => YtPlayerState;
}

type YtConstructor = new (
    el: HTMLElement,
    options: {
        width?: string | number;
        height?: string | number;
        videoId: string;
        playerVars?: Record<string, string | number>;
        events?: {
            onReady?: () => void;
            onStateChange?: (evt: { data: YtPlayerState }) => void;
        };
    }
) => YtPlayer;

type YtNamespace = { Player: YtConstructor };

declare global {
    interface Window {
        YT?: unknown;
        onYouTubeIframeAPIReady?: () => void;
    }
}

const isYtNamespace = (value: unknown): value is YtNamespace => {
    if (typeof value !== "object" || value === null) return false;
    const v = value as { Player?: unknown };
    return typeof v.Player === "function";
};

let ytApiPromise: Promise<YtNamespace> | null = null;

const loadYouTubeIframeApi = (): Promise<YtNamespace> => {
    if (ytApiPromise) return ytApiPromise;

    ytApiPromise = new Promise<YtNamespace>((resolve, reject) => {
        const existing = window.YT;
        if (isYtNamespace(existing)) {
            resolve(existing);
            return;
        }

        const tagId = "yt-iframe-api";
        const existingScript = document.getElementById(tagId);
        if (!existingScript) {
            const script = document.createElement("script");
            script.id = tagId;
            script.src = "https://www.youtube.com/iframe_api";
            script.async = true;
            script.onerror = () => reject(new Error("YouTube IFrame API 로드에 실패했습니다."));
            document.head.appendChild(script);
        }

        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            try {
                const yt = window.YT;
                if (!isYtNamespace(yt)) throw new Error("YouTube API 초기화 실패");
                resolve(yt);
            } catch (e: unknown) {
                reject(e instanceof Error ? e : new Error("YouTube API 초기화 실패"));
            } finally {
                window.onYouTubeIframeAPIReady = prev;
            }
        };
    });

    return ytApiPromise;
};

export type UseYoutubePlayerParams = {
    videoId: string | null;
    autoplay?: boolean;
    startSeconds?: number;
};

export type UseYoutubePlayerResult = {
    containerRef: React.RefObject<HTMLDivElement>;
    player: YtPlayer | null;
    isReady: boolean;
    error: string | null;
    currentTime: number;
    duration: number;
    state: YtPlayerState;
};

export const useYoutubePlayer = ({ videoId, autoplay = true, startSeconds = 0 }: UseYoutubePlayerParams): UseYoutubePlayerResult => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YtPlayer | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [state, setState] = useState<YtPlayerState>(-1);

    const playerVars = useMemo(() => {
        const vars: Record<string, string | number> = {
            autoplay: autoplay ? 1 : 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
        };
        if (startSeconds > 0) vars.start = Math.floor(startSeconds);
        return vars;
    }, [autoplay, startSeconds]);

    useEffect(() => {
        let mounted = true;
        const el = containerRef.current;
        if (!el || !videoId) return;

        setError(null);
        setIsReady(false);
        setCurrentTime(0);
        setDuration(0);
        setState(-1);

        const create = async () => {
            try {
                const YT = await loadYouTubeIframeApi();
                if (!mounted) return;

                // 기존 player 제거
                if (playerRef.current) {
                    playerRef.current.destroy();
                    playerRef.current = null;
                }
                el.innerHTML = "";

                const player = new YT.Player(el, {
                    videoId,
                    playerVars,
                    events: {
                        onReady: () => {
                            if (!mounted) return;
                            setIsReady(true);
                        },
                        onStateChange: (evt) => {
                            if (!mounted) return;
                            setState(evt.data);
                        },
                    },
                });
                playerRef.current = player;
            } catch (e: unknown) {
                if (!mounted) return;
                setError(e instanceof Error ? e.message : "YouTube 플레이어 초기화에 실패했습니다.");
            }
        };

        void create();

        return () => {
            mounted = false;
        };
    }, [playerVars, videoId]);

    useEffect(() => {
        if (!isReady || !playerRef.current) return;
        const id = window.setInterval(() => {
            const p = playerRef.current;
            if (!p) return;
            const t = p.getCurrentTime();
            const d = p.getDuration();
            if (Number.isFinite(t)) setCurrentTime(t);
            if (Number.isFinite(d) && d > 0) setDuration(d);
        }, 1000);
        return () => window.clearInterval(id);
    }, [isReady]);

    useEffect(() => {
        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, []);

    return {
        containerRef,
        player: playerRef.current,
        isReady,
        error,
        currentTime,
        duration,
        state,
    };
};


