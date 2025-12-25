# Skill: typescript-write (프로젝트 내장 템플릿)

목표: TypeScript `strict` 환경에서 타입/구조를 “규칙적으로” 정리해서 유지보수성을 올린다.

## 언제 쓰나
- 타입 에러/런타임 타입 불일치 수정
- Zod 스키마와 TS 타입을 함께 변경해야 할 때
- Firestore converter / TanStack Query 훅 타입 안정화

## 핵심 규칙
- `any` 금지. 필요하면 `unknown` + 타입 가드/Zod 파싱
- public API(Props/리턴)는 `interface` 우선
- 데이터 경계(Firestore/Network)는 **Zod로 validate**

## 실전 패턴
- Firestore:
  - 읽기: `withConverter` + `fromFirestore`에서 Zod parse
  - 쓰기: 필요한 경우 raw collection(write)로 분리(타입 충돌 방지), 대신 입력은 Zod로 검증
- React:
  - “조건부 Hook 호출” 금지(규칙 위반은 구조로 해결)
  - ref 값은 render에서 직접 읽지 말고 state로 미러링(필요 시)


