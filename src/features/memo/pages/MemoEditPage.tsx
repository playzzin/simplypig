import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { MEMO_ROUTES } from "../constants";
import { useMemoCategoriesQuery } from "../hooks/useMemoCategories";
import { useMemoByIdQuery, useUpdateSecretMemoMutation, useUpdateTextMemoMutation, useUpdateTodoMemoMutation } from "../hooks/useMemos";
import { decryptSecretText, encryptSecretText } from "../lib/crypto";
import type { Memo, TodoItem } from "../types";

interface MemoEditPageProps {
    uid: string | null;
}

const makeId = (): string => {
    const rnd = Math.random().toString(16).slice(2);
    return `t_${Date.now().toString(16)}_${rnd}`;
};

const deriveTitleFromContent = (content: string): string => {
    const firstLine = content.split(/\r?\n/)[0] ?? "";
    const t = firstLine.trim();
    return t.length > 0 ? t : "메모";
};

export const MemoEditPage: React.FC<MemoEditPageProps> = ({ uid }) => {
    const navigate = useNavigate();
    const { memoId } = useParams<{ memoId: string }>();
    const categoriesQuery = useMemoCategoriesQuery(uid);
    const memoQuery = useMemoByIdQuery(uid, memoId ?? null);

    const updateText = useUpdateTextMemoMutation(uid);
    const updateTodo = useUpdateTodoMemoMutation(uid);
    const updateSecret = useUpdateSecretMemoMutation(uid);

    const categories = categoriesQuery.data ?? [];

    const memo = memoQuery.data ?? null;

    const [categoryId, setCategoryId] = useState("");

    // text state
    const [textContent, setTextContent] = useState("");

    // todo state
    const [todoDraft, setTodoDraft] = useState("");
    const [todoItems, setTodoItems] = useState<TodoItem[]>([]);

    // secret state
    const [secretPassword, setSecretPassword] = useState("");
    const [secretPasswordConfirm, setSecretPasswordConfirm] = useState("");
    const [secretPlaintext, setSecretPlaintext] = useState<string | null>(null);
    const [isDecrypting, setIsDecrypting] = useState(false);

    useEffect(() => {
        if (!memo) return;
        setCategoryId(memo.categoryId);
        if (memo.type === "text") setTextContent(memo.content);
        if (memo.type === "todo") setTodoItems(memo.items);
        if (memo.type === "secret") setSecretPlaintext(null);
    }, [memo]);

    useEffect(() => {
        if (categoryId) return;
        if (memo?.categoryId) setCategoryId(memo.categoryId);
        else if (categories.length > 0) setCategoryId(categories[0]!.id);
    }, [categories, categoryId, memo?.categoryId]);

    const selectedCategoryColor = useMemo(() => {
        const c = categories.find((x) => x.id === categoryId) ?? null;
        return c?.colorHex ?? null;
    }, [categories, categoryId]);

    const addTodoItem = () => {
        const next = todoDraft.trim();
        if (next.length === 0) return;
        setTodoItems((prev) => [...prev, { id: makeId(), text: next, done: false }]);
        setTodoDraft("");
    };

    const toggleTodoDone = (id: string) => {
        setTodoItems((prev) => prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));
    };

    const removeTodoItem = (id: string) => {
        setTodoItems((prev) => prev.filter((it) => it.id !== id));
    };

    const decryptSecret = async (m: Extract<Memo, { type: "secret" }>) => {
        try {
            if (secretPassword.trim().length === 0) throw new Error("비밀번호를 입력하세요.");
            setIsDecrypting(true);
            const plaintext = await decryptSecretText(m.encrypted, secretPassword);
            setSecretPlaintext(plaintext);
            toast.success("비밀 메모를 열었어요.");
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("복호화에 실패했습니다.");
        } finally {
            setIsDecrypting(false);
        }
    };

    const save = async () => {
        try {
            if (!uid) throw new Error("로그인이 필요합니다.");
            if (!memoId) throw new Error("잘못된 요청입니다.");
            if (!memo) throw new Error("메모를 불러오지 못했습니다.");
            if (!categoryId) throw new Error("카테고리를 선택하세요.");

            if (memo.type === "text") {
                const title = deriveTitleFromContent(textContent);
                await updateText.mutateAsync({ memoId, title, content: textContent, categoryId });
                toast.success("수정 완료");
                navigate(MEMO_ROUTES.list);
                return;
            }

            if (memo.type === "todo") {
                const first = todoItems[0]?.text?.trim();
                const title = first && first.length > 0 ? first : "할 일";
                await updateTodo.mutateAsync({ memoId, title, categoryId, items: todoItems });
                toast.success("수정 완료");
                navigate(MEMO_ROUTES.list);
                return;
            }

            // secret
            if (secretPlaintext === null) throw new Error("먼저 비밀번호로 비밀 메모를 열어 주세요.");
            if (secretPassword.length < 4) throw new Error("비밀번호는 4자 이상으로 입력하세요.");
            if (secretPassword !== secretPasswordConfirm) throw new Error("비밀번호 확인이 일치하지 않습니다.");

            const encrypted = await encryptSecretText(secretPlaintext, secretPassword);
            await updateSecret.mutateAsync({ memoId, categoryId, encrypted });
            toast.success("수정 완료");
            navigate(MEMO_ROUTES.list);
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("수정 중 오류가 발생했습니다.");
        }
    };

    const pageTitle = memo?.type === "todo" ? "할일 메모 수정" : memo?.type === "secret" ? "비밀 메모 수정" : "메모 수정";

    return (
        <main className="main-content">
            <div className="card glass space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="view-title">{pageTitle}</h2>
                        <p className="lead">저장된 메모를 편집하고 업데이트합니다.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                            onClick={() => navigate(MEMO_ROUTES.list)}
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            className="h-10 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15 disabled:opacity-60"
                            onClick={() => void save()}
                            disabled={
                                !uid ||
                                !memo ||
                                updateText.isPending ||
                                updateTodo.isPending ||
                                updateSecret.isPending ||
                                (memo?.type === "secret" && secretPlaintext === null)
                            }
                        >
                            저장
                        </button>
                    </div>
                </div>

                {(memoQuery.isLoading || categoriesQuery.isLoading) && (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">로딩 중…</div>
                )}

                {(memoQuery.error || categoriesQuery.error) && (
                    <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                        데이터를 불러오지 못했습니다. Firebase 설정/권한을 확인해 주세요.
                    </div>
                )}

                {memo && (
                    <>
                        <div className="flex flex-wrap items-center gap-2">
                            {categories.map((c) => {
                                const isSelected = c.id === categoryId;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        className={`h-8 w-8 rounded-lg border transition ${
                                            isSelected ? "border-emerald-300/70 ring-2 ring-emerald-400/40" : "border-white/10 hover:border-white/20"
                                        }`}
                                        style={{ background: c.colorHex }}
                                        aria-label={`카테고리 선택: ${c.name}`}
                                        onClick={() => setCategoryId(c.id)}
                                    >
                                        <span className="sr-only">{c.name}</span>
                                    </button>
                                );
                            })}
                            {selectedCategoryColor && <span className="ml-auto h-2.5 w-2.5 rounded-full" style={{ background: selectedCategoryColor }} />}
                        </div>

                        {memo.type === "text" && (
                            <textarea
                                className="min-h-[240px] w-full resize-y rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-100 outline-none"
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                placeholder={"첫 줄이 제목으로 저장됩니다.\n\n예)\n회의 메모\n- 10시 팀 미팅\n- 이슈 정리"}
                            />
                        )}

                        {memo.type === "todo" && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 text-sm text-slate-100 outline-none"
                                        value={todoDraft}
                                        onChange={(e) => setTodoDraft(e.target.value)}
                                        placeholder="할 일을 입력하고 + 로 추가"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addTodoItem();
                                            }
                                        }}
                                    />
                                    <button type="button" className="btn-icon" aria-label="할 일 추가" onClick={addTodoItem}>
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {todoItems.length === 0 ? (
                                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                                            할 일 항목을 1개 이상 추가해 주세요.
                                        </div>
                                    ) : (
                                        todoItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                                            >
                                                <label className="flex items-center gap-3 text-sm text-slate-100">
                                                    <input type="checkbox" checked={item.done} onChange={() => toggleTodoDone(item.id)} />
                                                    <span className={item.done ? "line-through text-slate-400" : ""}>{item.text}</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                                                    onClick={() => removeTodoItem(item.id)}
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {memo.type === "secret" && (
                            <div className="space-y-3">
                                {secretPlaintext === null ? (
                                    <div className="space-y-2">
                                        <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                                            비밀번호를 입력해야 편집할 수 있어요. 비밀번호를 잊으면 복구할 수 없습니다.
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 text-sm text-slate-100 outline-none"
                                                type="password"
                                                value={secretPassword}
                                                onChange={(e) => setSecretPassword(e.target.value)}
                                                placeholder="비밀번호"
                                            />
                                            <button
                                                type="button"
                                                className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                                                onClick={() => void decryptSecret(memo)}
                                                disabled={isDecrypting}
                                            >
                                                열기
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <textarea
                                            className="min-h-[220px] w-full resize-y rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-100 outline-none"
                                            value={secretPlaintext}
                                            onChange={(e) => setSecretPlaintext(e.target.value)}
                                            placeholder={"비밀 내용을 편집하세요."}
                                        />
                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                            <input
                                                className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 text-sm text-slate-100 outline-none"
                                                type="password"
                                                value={secretPassword}
                                                onChange={(e) => setSecretPassword(e.target.value)}
                                                placeholder="비밀번호(4자 이상)"
                                            />
                                            <input
                                                className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 text-sm text-slate-100 outline-none"
                                                type="password"
                                                value={secretPasswordConfirm}
                                                onChange={(e) => setSecretPasswordConfirm(e.target.value)}
                                                placeholder="비밀번호 확인"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
};


