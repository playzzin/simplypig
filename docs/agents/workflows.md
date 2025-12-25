# 에이전트 워크플로우 가이드

## 공통
- 스택: Vite + React + TypeScript, Tailwind CSS, shadcn/ui(Neutral), lucide-react, Sonner, TanStack Query, Firebase, Zod.
- 경로 별칭: @/*
- 포맷: Prettier + prettier-plugin-tailwindcss

## 기본 플로우
1) 메인: 작업 분할 계획 수립.
2) UI-Developer: shadcn/ui + Tailwind로 UI 골격/상태 표현. 데이터는 Props로만.
3) Logic-Developer: Zod 스키마 → Firebase(withConverter) → TanStack Query 훅 구현. UI는 건드리지 않음.
4) 통합: UI에 훅/props 연결, 상태(loading/error/empty) 표시 확인.

## 모드 전환 명령 예시
- UI 모드: "지금부터 [UI-Developer] 모드. shadcn Dialog로 프로필 편집 UI 골격만 작성. 로직 없음."
- Logic 모드: "지금부터 [Logic-Developer] 모드. users 컬렉션 Zod 스키마 + useUserQuery/useUpdateUserMutation 훅 구현. UI는 수정 금지."

## 체크리스트
- UI와 로직 파일 경로 분리 준수.
- Zod 없는 데이터 처리 금지.
- Mutation 성공 시 invalidate 호출 여부 확인.
- 접근성(aria-label/role)과 로딩/에러/empty 상태 표현 확인.
