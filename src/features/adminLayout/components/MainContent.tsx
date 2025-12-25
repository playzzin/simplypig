import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { stats, getStatsToneClass } from "../data/siteData";
import { FirebaseConsoleLibrary, firebaseLinks } from "../pages/FirebaseConsoleLibrary";
import { MEMO_ROUTES } from "../../memo/constants";
import { MemoListPage } from "../../memo/pages/MemoListPage";
import { MemoNewPage } from "../../memo/pages/MemoNewPage";
import { MemoCategorySettingsPage } from "../../memo/pages/MemoCategorySettingsPage";
import { MemoEditPage } from "../../memo/pages/MemoEditPage";
import { YT_ROUTES } from "../../youtube/constants";
import { YtLibraryPage } from "../../youtube/pages/YtLibraryPage";
import { YtAddPage } from "../../youtube/pages/YtAddPage";
import { YtCategoriesPage } from "../../youtube/pages/YtCategoriesPage";
import { YtWatchPage } from "../../youtube/pages/YtWatchPage";
import { YtQueuePage } from "../../youtube/pages/YtQueuePage";
import { YtEditPage } from "../../youtube/pages/YtEditPage";

interface MainContentProps {
    selectedView: string;
    uid: string | null;
    authError: string | null;
}

export const MainContent: React.FC<MainContentProps> = ({ selectedView, uid, authError }) => {
    const findLink = (label: string) => firebaseLinks.find((l) => l.label === label);

    const renderInfoCard = (
        title: string,
        description: string,
        bullets?: string[],
        linkLabel?: string
    ): ReactNode => (
        <main className="main-content">
            <div className="card glass space-y-4">
                <div>
                    <h2 className="view-title">{title}</h2>
                    <p className="lead">{description}</p>
                </div>
                {bullets && (
                    <ul className="space-y-2">
                        {bullets.map((item) => (
                            <li
                                key={item}
                                className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                            >
                                <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                )}
                {linkLabel && findLink(linkLabel) && (
                    <a
                        className="inline-flex items-center gap-2 w-fit rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
                        href={findLink(linkLabel)!.href}
                        target="_blank"
                        rel="noreferrer"
                    >
                        콘솔로 이동
                        <span aria-hidden>↗</span>
                    </a>
                )}
            </div>
        </main>
    );

    const viewContent: Record<string, ReactNode> = {
        // Firebase Console Library (단일 엔트리)
        "콘솔 라이브러리": <FirebaseConsoleLibrary />,

        // DB 등록
        DB등록: renderInfoCard("DB 등록", "회원/팀장/현장 데이터 등록 워크플로우를 선택하세요.", [
            "좌측 서브 메뉴에서 세부 작업을 골라 이동",
            "입력 폼 유효성 검증 · 업로드 준비 상태 점검",
        ]),
        회원등록: renderInfoCard("회원등록", "신규 사용자 계정을 생성하고 권한을 부여합니다.", [
            "필수: 이름, 연락처, 기본 권한",
            "선택: 소속 팀, 메모",
        ]),
        팀장등록: renderInfoCard("팀장등록", "팀장 정보를 추가하고 팀원을 매핑합니다.", [
            "필수: 팀명, 팀장 연락처",
            "선택: 담당 현장, 주 야간 구분",
        ]),
        현장등록: renderInfoCard("현장등록", "작업 현장 정보를 등록하고 위치/시작일을 기록합니다.", [
            "필수: 현장명, 주소, 착공일",
            "선택: 지도 링크, 비고",
        ]),

        // 출력일보
        출력일보: renderInfoCard("출력일보", "일별 출력 데이터를 수집·검토합니다.", [
            "좌측 서브 메뉴에서 세부 뷰 선택",
            "집계 전 데이터 검증 필수",
        ]),
        출력입력: renderInfoCard("출력입력", "일일 작업량을 입력하거나 CSV로 업로드합니다.", [
            "작업일자/팀/작업자별 입력",
            "중복 업로드 방지 체크",
        ]),
        "현장별 데이터": renderInfoCard("현장별 데이터", "현장 단위로 필터링/정렬하여 진행 현황을 확인합니다."),
        "팀장별 데이터": renderInfoCard("팀장별 데이터", "팀장 기준으로 작업량과 품질 지표를 검토합니다."),
        "작업자별 데이터": renderInfoCard("작업자별 데이터", "작업자별 실적 및 이슈를 추적합니다."),
        "검색&리포트": renderInfoCard("검색&리포트", "조건 검색과 리포트 출력/다운로드를 수행합니다."),

        // 청구서
        청구서: renderInfoCard("청구서", "노무비 청구 및 명세서를 관리합니다.", [
            "현장/팀장/작업자 단위 서브 메뉴에서 조회",
            "정산 기준일과 단가 테이블 확인",
        ]),
        "현장별 노무비": renderInfoCard("현장별 노무비", "현장 단위 청구 내역을 확인하고 내보냅니다."),
        "팀장별 노무비": renderInfoCard("팀장별 노무비", "팀장 단위 정산 데이터를 검토합니다."),
        "작업자 명세서": renderInfoCard("작업자 명세서", "개별 작업자 명세서 발행/다운로드를 처리합니다."),
    };

    if (viewContent[selectedView]) {
        return viewContent[selectedView];
    }

    return (
        <Routes>
            <Route path={MEMO_ROUTES.root} element={<Navigate to={MEMO_ROUTES.list} replace />} />
            <Route path={MEMO_ROUTES.list} element={<MemoListPage uid={uid} />} />
            <Route path={MEMO_ROUTES.create} element={<MemoNewPage uid={uid} />} />
            <Route path={MEMO_ROUTES.categories} element={<MemoCategorySettingsPage uid={uid} />} />
            <Route path={MEMO_ROUTES.edit} element={<MemoEditPage uid={uid} />} />

            <Route path={YT_ROUTES.root} element={<Navigate to={YT_ROUTES.library} replace />} />
            <Route path={YT_ROUTES.library} element={<YtLibraryPage uid={uid} />} />
            <Route path={YT_ROUTES.add} element={<YtAddPage uid={uid} />} />
            <Route path={YT_ROUTES.categories} element={<YtCategoriesPage uid={uid} />} />
            <Route path={YT_ROUTES.queue} element={<YtQueuePage uid={uid} />} />
            <Route path={YT_ROUTES.watch} element={<YtWatchPage uid={uid} />} />
            <Route path={YT_ROUTES.edit} element={<YtEditPage uid={uid} />} />
            <Route
                path="*"
                element={
                    <main className="main-content">
                        <div className="card glass">
                            <h2 className="view-title">{selectedView}</h2>
                            <p className="lead">사이드바 접힘/펼침, 우측 패널, 플로팅 레이어를 갖춘 admin 레이아웃 스켈레톤입니다.</p>
                            {authError && (
                                <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                                    Firebase 인증 오류: {authError}
                                </div>
                            )}
                            <div className="stats-grid">
                                {stats.map((stat) => (
                                    <div key={stat.label} className={`stat-box ${getStatsToneClass(stat.tone)}`}>
                                        <div className="stat-tag">{stat.label}</div>
                                        <div className="stat-num">{stat.value}</div>
                                        <div className="stat-hint">{stat.tag}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </main>
                }
            />
        </Routes>
    );
};


