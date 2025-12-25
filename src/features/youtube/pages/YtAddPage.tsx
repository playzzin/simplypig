import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MEMO_ROUTES } from "../../memo/constants";
import { YT_ROUTES } from "../constants";
import { fetchYoutubeMetadata } from "../api/oembed";
import { useYtCategoriesQuery } from "../hooks/useYtCategories";
import { useCreateYtVideoMutation } from "../hooks/useYtVideos";
import { parseYoutubeUrl } from "../lib/youtubeUrl";

interface YtAddPageProps {
    uid: string | null;
}

export const YtAddPage: React.FC<YtAddPageProps> = ({ uid }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const categoriesQuery = useYtCategoriesQuery(uid);
    const createVideo = useCreateYtVideoMutation(uid);

    const categories = categoriesQuery.data ?? [];
    const [categoryId, setCategoryId] = useState("");

    const [urlInput, setUrlInput] = useState("");
    const [note, setNote] = useState("");

    const [parsedVideoId, setParsedVideoId] = useState<string | null>(null);
    const [normalizedUrl, setNormalizedUrl] = useState<string | null>(null);
    const [title, setTitle] = useState<string>("");
    const [channelName, setChannelName] = useState<string | null>(null);
    const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
    const [metaSource, setMetaSource] = useState<"oembed" | "fallback" | null>(null);
    const [autoPreviewPending, setAutoPreviewPending] = useState(false);

    useEffect(() => {
        if (categoryId) return;
        if (categories.length === 0) return;
        setCategoryId(categories[0]!.id);
    }, [categories, categoryId]);

    const canPreview = useMemo(() => urlInput.trim().length > 0, [urlInput]);

    const extractPrefillUrl = (search: string): string | null => {
        const params = new URLSearchParams(search);
        // 북마클릿/공유 입력에서 흔히 쓰는 파라미터명을 폭넓게 허용
        const raw = params.get("url") ?? params.get("u") ?? params.get("text");
        const candidate = raw?.trim();
        if (!candidate) return null;
        return candidate;
    };

    useEffect(() => {
        const prefill = extractPrefillUrl(location.search);
        if (!prefill) return;

        // 사용자가 이미 입력을 시작했으면 덮어쓰지 않음
        if (urlInput.trim().length > 0) return;

        setUrlInput(prefill);
        // uid(익명 로그인 포함)가 아직 준비되지 않았더라도, 준비되는 순간 자동 미리보기 실행
        setAutoPreviewPending(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    const preview = async () => {
        try {
            const parsed = parseYoutubeUrl(urlInput);
            setParsedVideoId(parsed.videoId);
            setNormalizedUrl(parsed.normalizedUrl);

            const meta = await fetchYoutubeMetadata(parsed.normalizedUrl, parsed.videoId);
            setTitle(meta.title);
            setChannelName(meta.channelName);
            setThumbnailUrl(meta.thumbnailUrl);
            setMetaSource(meta.source);
        } catch (e: unknown) {
            setParsedVideoId(null);
            setNormalizedUrl(null);
            setTitle("");
            setChannelName(null);
            setThumbnailUrl("");
            setMetaSource(null);
            if (e instanceof Error) toast.error(e.message);
            else toast.error("미리보기에 실패했습니다.");
        }
    };

    useEffect(() => {
        if (!autoPreviewPending) return;
        if (!uid) return;
        if (!canPreview) return;
        void preview().finally(() => setAutoPreviewPending(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPreviewPending, uid, canPreview]);

    const canSave = Boolean(uid) && Boolean(parsedVideoId) && Boolean(normalizedUrl) && categoryId.trim().length > 0;

    const save = async () => {
        try {
            if (!uid) throw new Error("로그인이 필요합니다.");
            if (!parsedVideoId || !normalizedUrl) throw new Error("먼저 미리보기를 실행하세요.");
            if (!categoryId) throw new Error("카테고리를 선택하세요.");
            if (!title || !thumbnailUrl) throw new Error("메타데이터를 불러오지 못했습니다.");

            await createVideo.mutateAsync({
                videoId: parsedVideoId,
                url: normalizedUrl,
                title,
                channelName,
                thumbnailUrl,
                categoryId,
                note: note.trim(),
            });
            toast.success("라이브러리에 저장했어요.");
            navigate(YT_ROUTES.library);
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("저장 중 오류가 발생했습니다.");
        }
    };

    if (categories.length === 0 && !categoriesQuery.isLoading) {
        return (
            <main className="main-content">
                <div className="card glass space-y-4">
                    <div>
                        <h2 className="view-title">유튜브 추가</h2>
                        <p className="lead">먼저 유튜브 카테고리를 만들어 주세요.</p>
                    </div>
                    <button
                        type="button"
                        className="h-10 w-fit rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                        onClick={() => navigate(YT_ROUTES.categories)}
                    >
                        유튜브 카테고리 설정
                    </button>
                    <div className="text-xs text-slate-400">
                        참고: 메모 카테고리(`{MEMO_ROUTES.categories}`)와 유튜브 카테고리는 분리되어 있어요.
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="main-content">
            <div className="card glass space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="view-title">유튜브 추가</h2>
                        <p className="lead">영상 주소만 붙여넣으면 제목/썸네일을 자동으로 가져옵니다.</p>
                    </div>
                    <button
                        type="button"
                        className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                        onClick={() => navigate(YT_ROUTES.library)}
                    >
                        라이브러리
                    </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                    <div className="grid gap-2">
                        <label className="text-xs font-semibold text-slate-300">유튜브 주소</label>
                        <input
                            className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 text-sm text-slate-100 outline-none"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            disabled={!uid}
                        />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            {categories.map((c) => {
                                const isSelected = c.id === categoryId;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        className={`h-8 rounded-xl border px-2 text-xs font-semibold transition ${
                                            isSelected ? "border-emerald-300/60 bg-emerald-500/10 text-emerald-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                                        }`}
                                        onClick={() => setCategoryId(c.id)}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.colorHex }} aria-hidden />
                                            <span>{c.name}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                                onClick={() => void preview()}
                                disabled={!uid || !canPreview}
                            >
                                미리보기
                            </button>
                            <button
                                type="button"
                                className="h-10 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15 disabled:opacity-60"
                                onClick={() => void save()}
                                disabled={!canSave || createVideo.isPending}
                            >
                                저장
                            </button>
                        </div>
                    </div>

                    {thumbnailUrl && (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr]">
                            <img
                                className="w-full rounded-xl border border-white/10 object-cover"
                                src={thumbnailUrl}
                                alt="유튜브 썸네일"
                                loading="lazy"
                            />
                            <div className="space-y-2">
                                <div className="text-sm font-semibold text-slate-100">{title}</div>
                                <div className="text-xs text-slate-300">{channelName ?? "채널 정보 없음"}</div>
                                <div className="text-xs text-slate-400">
                                    메타 소스: {metaSource === "oembed" ? "oEmbed(간단/빠름)" : "fallback(썸네일만)"}
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-semibold text-slate-300">간단 메모</label>
                                    <textarea
                                        className="min-h-[90px] w-full resize-y rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-slate-100 outline-none"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="예) 2배속으로 보면 좋음 / 03:20부터 핵심"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};


