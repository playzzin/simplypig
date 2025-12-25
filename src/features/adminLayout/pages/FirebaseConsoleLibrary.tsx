import { ExternalLink } from "lucide-react";

export const projectId = "simplypig";

export const firebaseLinks = [
    {
        label: "Firebase 콘솔",
        href: `https://console.firebase.google.com/u/0/project/${projectId}/overview`,
        desc: "프로젝트 설정, 인증, Firestore, Storage 관리",
    },
    {
        label: "Firestore 규칙",
        href: `https://console.firebase.google.com/u/0/project/${projectId}/firestore/rules`,
        desc: "보안 규칙 편집 및 배포",
    },
    {
        label: "Firestore 데이터베이스",
        href: `https://console.firebase.google.com/u/0/project/${projectId}/firestore/databases/-default-/data`,
        desc: "컬렉션/도큐먼트 탐색 및 쿼리",
    },
    {
        label: "Authentication",
        href: `https://console.firebase.google.com/u/0/project/${projectId}/authentication/users`,
        desc: "사용자 계정 및 제공자 설정",
    },
    {
        label: "Storage",
        href: `https://console.firebase.google.com/u/0/project/${projectId}/storage/${projectId}.firebasestorage.app/files`,
        desc: "파일 업로드/권한/버킷 관리",
    },
];

export const FirebaseConsoleLibrary: React.FC = () => {
    return (
        <main className="main-content">
            <div className="card glass">
                <h2 className="view-title">Firebase 콘솔 라이브러리</h2>
                <p className="lead">주요 콘솔 링크와 간단한 설명을 모았습니다. 클릭 시 새 탭에서 열립니다.</p>
                <div className="space-y-3 mt-4">
                    {firebaseLinks.map((link) => (
                        <a
                            key={link.href}
                            className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-emerald-400/40 hover:bg-white/10"
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <span className="mt-0.5 text-emerald-300">
                                <ExternalLink size={16} />
                            </span>
                            <span>
                                <div className="font-semibold text-slate-100">{link.label}</div>
                                <div className="text-sm text-slate-300 mt-0.5">{link.desc}</div>
                            </span>
                        </a>
                    ))}
                </div>
            </div>
        </main>
    );
};
