import { useNavigate } from "react-router-dom";
import { MEMO_ROUTES } from "../constants";
import { MemoCreateAdvanced } from "../components/MemoCreateAdvanced";

interface MemoNewPageProps {
    uid: string | null;
}

export const MemoNewPage: React.FC<MemoNewPageProps> = ({ uid }) => {
    const navigate = useNavigate();
    return (
        <main className="main-content">
            <div className="card glass space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="view-title">새 메모</h2>
                        <p className="lead">스티커 메모를 작성하고 저장합니다.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                            onClick={() => navigate(MEMO_ROUTES.list)}
                        >
                            목록으로
                        </button>
                        <button
                            type="button"
                            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                            onClick={() => navigate(MEMO_ROUTES.categories)}
                        >
                            카테고리 설정
                        </button>
                    </div>
                </div>

                <MemoCreateAdvanced uid={uid} />
            </div>
        </main>
    );
};


