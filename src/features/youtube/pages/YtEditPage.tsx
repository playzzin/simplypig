import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { YT_ROUTES } from "../constants";
import { useYtCategoriesQuery } from "../hooks/useYtCategories";
import { useUpdateYtVideoMutation, useYtVideosQuery } from "../hooks/useYtVideos";

interface YtEditPageProps {
    uid: string | null;
}

export const YtEditPage: React.FC<YtEditPageProps> = ({ uid }) => {
    const navigate = useNavigate();
    const { videoDocId } = useParams<{ videoDocId: string }>();

    const categoriesQuery = useYtCategoriesQuery(uid);
    const videosQuery = useYtVideosQuery(uid);
    const updateVideo = useUpdateYtVideoMutation(uid);

    const categories = categoriesQuery.data ?? [];
    const videos = videosQuery.data ?? [];

    const video = useMemo(() => {
        if (!videoDocId) return null;
        return videos.find((v) => v.id === videoDocId) ?? null;
    }, [videoDocId, videos]);

    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [note, setNote] = useState("");

    useEffect(() => {
        if (!video) return;
        setTitle(video.title);
        setCategoryId(video.categoryId);
        setNote(video.note);
    }, [video]);

    useEffect(() => {
        if (categoryId) return;
        if (categories.length === 0) return;
        setCategoryId(categories[0]!.id);
    }, [categories, categoryId]);

    const save = async () => {
        try {
            if (!uid) throw new Error("로그인이 필요합니다.");
            if (!videoDocId) throw new Error("잘못된 주소입니다.");
            await updateVideo.mutateAsync({ videoDocId, title, categoryId, note });
            toast.success("수정했어요.");
            navigate(YT_ROUTES.library);
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("수정 중 오류가 발생했습니다.");
        }
    };

    return (
        <main className="main-content">
            <div className="card glass space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="view-title">유튜브 수정</h2>
                        <p className="lead">제목/카테고리/메모를 수정합니다.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                            onClick={() => navigate(YT_ROUTES.library)}
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            className="h-10 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15 disabled:opacity-60"
                            onClick={() => void save()}
                            disabled={!uid || !videoDocId || updateVideo.isPending}
                        >
                            저장
                        </button>
                    </div>
                </div>

                {(categoriesQuery.isLoading || videosQuery.isLoading) && (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">로딩 중…</div>
                )}

                {(categoriesQuery.error || videosQuery.error) && (
                    <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                        데이터를 불러오지 못했습니다. Firebase 설정/권한을 확인해 주세요.
                    </div>
                )}

                {!video && !videosQuery.isLoading && (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                        수정할 영상을 찾지 못했습니다.
                    </div>
                )}

                {video && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold text-slate-300">제목</label>
                            <input
                                className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 text-sm text-slate-100 outline-none"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="제목"
                                disabled={!uid}
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs font-semibold text-slate-300">카테고리</label>
                            <div className="flex flex-wrap items-center gap-2">
                                {categories.map((c) => {
                                    const selected = c.id === categoryId;
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            className={`h-8 rounded-xl border px-2 text-xs font-semibold transition ${
                                                selected
                                                    ? "border-emerald-300/60 bg-emerald-500/10 text-emerald-100"
                                                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
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
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs font-semibold text-slate-300">간단 메모</label>
                            <textarea
                                className="min-h-[120px] w-full resize-y rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-slate-100 outline-none"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="예) 03:20 핵심 / 1.5배속 추천"
                                disabled={!uid}
                            />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};


