import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { buildMemoEditRoute, MEMO_ROUTES } from "../constants";
import { useMemoCategoriesQuery } from "../hooks/useMemoCategories";
import { useDeleteMemoMutation, useMemosQuery, useUpdateTodoItemsMutation } from "../hooks/useMemos";
import { decryptSecretText } from "../lib/crypto";
import type { Memo, TodoItem } from "../types";

type SortKey = "updatedAt" | "title" | "category";

interface MemoListPageProps {
    uid: string | null;
}

export const MemoListPage: React.FC<MemoListPageProps> = ({ uid }) => {
    const navigate = useNavigate();
    const categoriesQuery = useMemoCategoriesQuery(uid);
    const memosQuery = useMemosQuery(uid);
    const deleteMemo = useDeleteMemoMutation(uid);
    const updateTodo = useUpdateTodoItemsMutation(uid);

    const categories = categoriesQuery.data ?? [];
    const memos = memosQuery.data ?? [];

    const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

    const handleDelete = async (memoId: string) => {
        try {
            await deleteMemo.mutateAsync(memoId);
            toast.success("메모를 삭제했어요.");
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("삭제 중 오류가 발생했습니다.");
        }
    };

    const [secretPasswordById, setSecretPasswordById] = useState<Record<string, string>>({});
    const [secretPlainById, setSecretPlainById] = useState<Record<string, string>>({});
    const [secretOpenById, setSecretOpenById] = useState<Record<string, boolean>>({});
    const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
    const [sortOrderDesc, setSortOrderDesc] = useState(true);
    const [compactMode, setCompactMode] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<Memo["type"] | "all">("all");

    const toggleSecretOpen = (id: string) => {
        setSecretOpenById((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDecrypt = async (id: string, encrypted: Parameters<typeof decryptSecretText>[0]) => {
        try {
            const pwd = secretPasswordById[id] ?? "";
            if (pwd.trim().length === 0) throw new Error("비밀번호를 입력하세요.");
            const plaintext = await decryptSecretText(encrypted, pwd);
            setSecretPlainById((prev) => ({ ...prev, [id]: plaintext }));
            setSecretOpenById((prev) => ({ ...prev, [id]: true }));
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("복호화에 실패했습니다.");
        }
    };

    const handleHideSecret = (id: string) => {
        setSecretPlainById((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const handleToggleTodo = async (memoId: string, items: TodoItem[], itemId: string) => {
        const nextItems = items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it));
        try {
            await updateTodo.mutateAsync({ memoId, items: nextItems });
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("업데이트 중 오류가 발생했습니다.");
        }
    };

    const filteredMemos = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        return memos.filter((m) => {
            if (categoryFilter !== "all" && m.categoryId !== categoryFilter) return false;
            if (typeFilter !== "all" && m.type !== typeFilter) return false;
            const catName = categoryById.get(m.categoryId)?.name?.toLowerCase() ?? "";
            const titleHit = keyword ? m.title.toLowerCase().includes(keyword) : true;
            const categoryHit = keyword ? catName.includes(keyword) : true;
            const noKeyword = keyword.length === 0;
            if (m.type === "text") {
                const contentHit = keyword ? m.content.toLowerCase().includes(keyword) : true;
                return noKeyword ? true : titleHit || categoryHit || contentHit;
            }
            if (m.type === "todo") {
                const itemsHit = keyword ? m.items.some((it) => it.text.toLowerCase().includes(keyword)) : true;
                return noKeyword ? true : titleHit || categoryHit || itemsHit;
            }
            // secret 메모는 제목/카테고리만 검색
            return noKeyword ? true : titleHit || categoryHit;
        });
    }, [categoryById, memos, searchTerm, categoryFilter, typeFilter]);

    const sortedMemos = useMemo(() => {
        const base = [...filteredMemos];
        return base.sort((a, b) => {
            const direction = sortOrderDesc ? -1 : 1;
            if (sortKey === "updatedAt") {
                return (a.updatedAt.getTime() - b.updatedAt.getTime()) * direction;
            }
            if (sortKey === "title") {
                return a.title.localeCompare(b.title) * direction;
            }
            const ca = categoryById.get(a.categoryId)?.name ?? "";
            const cb = categoryById.get(b.categoryId)?.name ?? "";
            return ca.localeCompare(cb) * direction;
        });
    }, [categoryById, filteredMemos, sortKey, sortOrderDesc]);

    const handleToggleExpand = (id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const renderSortLabel = (key: SortKey) => {
        if (key === "updatedAt") return "업데이트순";
        if (key === "title") return "제목순";
        return "카테고리순";
    };

    return (
        <main className="main-content">
            <div className="card glass space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="view-title">메모 목록</h2>
                        <p className="lead">저장된 스티커 메모를 확인하고 관리합니다.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                            onClick={() => navigate(MEMO_ROUTES.categories)}
                        >
                            카테고리 설정
                        </button>
                        <button
                            type="button"
                            className="h-10 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
                            onClick={() => navigate(MEMO_ROUTES.create)}
                        >
                            새 메모
                        </button>
                    </div>
                </div>

                {!uid && (
                    <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        Firebase 인증 준비 중입니다. 잠시만 기다려 주세요.
                    </div>
                )}

                {(categoriesQuery.isLoading || memosQuery.isLoading) && (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">로딩 중…</div>
                )}

                {(categoriesQuery.error || memosQuery.error) && (
                    <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                        데이터를 불러오지 못했습니다. Firebase 설정/권한을 확인해 주세요.
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-300">검색</label>
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="제목/내용/카테고리 검색"
                            className="h-9 w-64 rounded-xl border border-white/10 bg-slate-950/35 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-300">카테고리</label>
                        <select
                            className="h-9 rounded-xl border border-white/10 bg-slate-950/35 px-2 text-sm text-slate-100 outline-none"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="all">전체</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-300">타입</label>
                        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-1">
                            {(["all", "text", "todo", "secret"] as Array<Memo["type"] | "all">).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    className={`px-2 py-1 text-xs font-semibold rounded-lg transition ${
                                        typeFilter === type
                                            ? "bg-cyan-500/15 text-cyan-100 border border-cyan-400/40"
                                            : "text-slate-200 hover:bg-white/5"
                                    }`}
                                    onClick={() => {
                                        setTypeFilter(type);
                                        if (expandedId && type !== "all" && sortedMemos.find((m) => m.id === expandedId)?.type !== type) {
                                            setExpandedId(null);
                                        }
                                    }}
                                >
                                    {type === "all" ? "전체" : type === "text" ? "텍스트" : type === "todo" ? "할 일" : "비밀"}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-300">정렬</label>
                        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-1">
                            {(["updatedAt", "title", "category"] as SortKey[]).map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    className={`px-2 py-1 text-xs font-semibold rounded-lg transition ${
                                        sortKey === key
                                            ? "bg-emerald-500/15 text-emerald-100 border border-emerald-400/40"
                                            : "text-slate-200 hover:bg-white/5"
                                    }`}
                                    onClick={() => setSortKey(key)}
                                >
                                    {renderSortLabel(key)}
                                </button>
                            ))}
                            <button
                                type="button"
                                className="btn-icon btn-icon-sm"
                                aria-label="정렬 방향 전환"
                                onClick={() => setSortOrderDesc((prev) => !prev)}
                            >
                                {sortOrderDesc ? "↓" : "↑"}
                            </button>
                        </div>
                    </div>
                    <button
                        type="button"
                        className={`h-8 rounded-xl border px-3 text-xs font-semibold transition ${
                            compactMode
                                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                                : "border-white/10 bg-white/5 text-slate-100"
                        }`}
                        onClick={() => {
                            setCompactMode((prev) => !prev);
                            if (!compactMode) setExpandedId(null);
                        }}
                    >
                        {compactMode ? "상세 보기" : "제목만 보기(컴팩트)"}
                    </button>
                </div>

                {uid && !memosQuery.isLoading && sortedMemos.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                        아직 메모가 없어요. “새 메모” 또는 작업 레이어에서 저장해보세요.
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {sortedMemos.map((m) => {
                        const c = categoryById.get(m.categoryId) ?? null;
                        const tone = c?.colorHex ?? "#94A3B8";
                        const isExpanded = expandedId === m.id;
                        const showCompact = compactMode && !isExpanded;
                        return (
                            <div
                                key={m.id}
                                className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 ${
                                    isExpanded ? "md:col-span-2 xl:col-span-3" : ""
                                }`}
                                style={{ boxShadow: `inset 0 0 0 2px ${tone}22` }}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="h-3 w-3 rounded-full"
                                                style={{ background: tone }}
                                                title={c?.name ?? "미지정"}
                                                aria-label={c?.name ?? "미지정"}
                                            />
                                            <div className="text-xs font-semibold text-slate-300">{c?.name ?? "미지정"}</div>
                                        </div>
                                        <div className="mt-1 truncate text-base font-bold text-slate-100">{m.title}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="btn-icon"
                                            aria-label={isExpanded ? "접기" : "확대"}
                                            onClick={() => handleToggleExpand(m.id)}
                                        >
                                            {isExpanded ? "–" : "＋"}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-icon"
                                            aria-label="수정"
                                            onClick={() => navigate(buildMemoEditRoute(m.id))}
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-icon"
                                            aria-label="삭제"
                                            onClick={() => handleDelete(m.id)}
                                            disabled={deleteMemo.isPending}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {m.type === "text" && !showCompact && (
                                    <div className={`mt-3 whitespace-pre-wrap ${isExpanded ? "text-base leading-7" : "text-sm"} text-slate-200`}>
                                        {m.content}
                                    </div>
                                )}

                                {m.type === "todo" && !showCompact && (
                                    <div className="mt-3 space-y-2">
                                        {m.items.map((it) => (
                                            <label key={it.id} className="flex items-center gap-3 text-sm text-slate-100">
                                                <input
                                                    type="checkbox"
                                                    checked={it.done}
                                                    onChange={() => void handleToggleTodo(m.id, m.items, it.id)}
                                                    disabled={updateTodo.isPending}
                                                />
                                                <span className={it.done ? "line-through text-slate-400" : ""}>{it.text}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {m.type === "secret" && !showCompact && (
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-slate-200">
                                            <Lock size={16} />
                                            <span>비밀번호를 입력해야 볼 수 있어요.</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 text-sm text-slate-100 outline-none"
                                                type="password"
                                                value={secretPasswordById[m.id] ?? ""}
                                                onChange={(e) =>
                                                    setSecretPasswordById((prev) => ({ ...prev, [m.id]: e.target.value }))
                                                }
                                                placeholder="비밀번호"
                                            />
                                            {secretPlainById[m.id] ? (
                                                <button
                                                    type="button"
                                                    className="btn-icon"
                                                    aria-label="숨기기"
                                                    onClick={() => handleHideSecret(m.id)}
                                                >
                                                    <EyeOff size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="btn-icon"
                                                    aria-label="보기"
                                                    onClick={() => void handleDecrypt(m.id, m.encrypted)}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                        </div>
                                        {secretPlainById[m.id] && (
                                            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100">
                                                <button
                                                    type="button"
                                                    className="mb-2 text-xs font-semibold text-slate-300 underline"
                                                    onClick={() => toggleSecretOpen(m.id)}
                                                >
                                                    {secretOpenById[m.id] ? "접기" : "펼치기"}
                                                </button>
                                                {secretOpenById[m.id] && (
                                                    <div className="whitespace-pre-wrap text-sm text-slate-200">
                                                        {secretPlainById[m.id]}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                                    <span>업데이트: {m.updatedAt.toLocaleString()}</span>
                                    {showCompact && (
                                        <button
                                            type="button"
                                            className="text-emerald-200 underline underline-offset-4"
                                            onClick={() => handleToggleExpand(m.id)}
                                        >
                                            크게 보기
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
};


