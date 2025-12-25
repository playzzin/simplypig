# Skill: frontend-design (프로젝트 내장 템플릿)

목표: “AI 느낌”을 최소화하고, **상용화급 UI 품질**(레이아웃/타이포/상태/접근성/일관성)을 빠르게 만든다.

## 언제 쓰나
- 페이지/다이얼로그/패널/리스트 카드처럼 “UI 비중”이 큰 작업
- UX 디테일(hover/focus/disabled/loading/empty/error) 설계가 필요한 작업

## 규칙(우리 프로젝트 기준)
- UI 구현은 `docs/agents/ui-developer-rules.md`를 우선 준수
- 라이브러리: Tailwind + lucide-react + sonner
- 상태는 Props/훅 결과로만 주입(데이터 fetch는 UI에서 하지 않음)

## 체크리스트
- 정보 구조: 제목/보조문구/CTA 버튼/보조 액션을 명확히 분리
- 상태 표현: loading/error/empty/disabled 모두 포함
- 접근성: label/aria-label, focus ring, 키보드 동작
- 성능: 불필요한 re-render 방지(정말 필요할 때만 memo/useMemo/useCallback)


