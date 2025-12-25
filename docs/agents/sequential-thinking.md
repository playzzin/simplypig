# Skill: sequential-thinking (프로젝트 내장 템플릿)

목표: 복잡한 작업(기능 추가/리팩토링/데이터 모델 설계)을 할 때 **계획→리스크→전략→검증** 흐름을 강제해서 품질을 안정화한다.

## 언제 쓰나
- 기능이 2단계 이상으로 쪼개지는 작업(예: TikTok 인라인 재생, PWA 공유 타겟, 큐 UX 개편)
- 스키마/DB 모델 변경이 포함되는 작업
- UI/로직 분리 리팩토링
- 버그 원인 분석 + 재발 방지까지 필요한 작업

## 출력 포맷(반드시)
아래 4블록을 **코드 생성/수정 전에** 먼저 출력한다.

1) 🔍 Context Analysis (맥락 분석)
- 목표/현상/재현 경로
- 관련 파일/함수 후보

2) ⚠️ Edge Case & Risk Assessment (위험 요소)
- null/undefined, race condition, 성능 병목, 보안/권한, 데이터 마이그레이션 위험

3) 🛠️ Implementation Strategy (구현 전략)
- 어떤 파일을 어떻게 바꾸는지
- 어떤 hook/library를 쓸지(예: TanStack Query, Zod, withConverter)
- UI-Developer/Logic-Developer 모드 분리 여부

4) ✅ Verification Plan (검증)
- lint/build 통과 기준
- UI 동작 시나리오(성공/로딩/에러/empty)

## 운영 원칙
- “바로 코딩” 금지: 위 4블록을 먼저.
- 파일/심볼 근거 확인(경로/임포트) 후 수정.
- 수정 범위를 작게 유지하고, 필요 시 단계적으로 PR 단위를 나눈다.


