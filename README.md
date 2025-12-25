# SimplyPig — React + TypeScript + Vite

본 프로젝트는 Vite + React + TypeScript 기반이며 Tailwind CSS, shadcn/ui, React Hook Form + Zod, Firebase 스택을 사용합니다.

## 개발 툴링

### React DevTools
- **브라우저 확장**: Chrome/Edge 웹스토어에서 React DevTools 설치 후 DevTools → Components/Profiler 탭 사용.
- **스탠드얼론**: `npm install -g react-devtools` 후 `react-devtools` 실행 → 기본 포트 8097로 Vite 앱에 자동 연결.
  - 포트 충돌 시 `PORT=8098 react-devtools`처럼 변경 가능.

### Tailwind CSS DevTools
- **브라우저 확장**: [Tailwind CSS Devtools](https://chromewebstore.google.com/detail/tailwind-css-devtools/ebgaoibnchbkmmcijjpfcbmiffegcgeo) 설치 → 페이지에서 Tailwind 클래스 인스펙트/토글 가능.
- **VS Code 확장**: Tailwind CSS IntelliSense 설치 추천(클래스 자동완성/정의 이동/색 미리보기).
- **포매팅**: Prettier + `prettier-plugin-tailwindcss`가 설치되어 있어 `Format on Save` 또는 `npx prettier "src/**/*.{ts,tsx,css}" --write`로 클래스 순서 자동 정렬.

## React Compiler

React Compiler는 성능 영향 때문에 기본 비활성화 상태입니다. 필요 시 [공식 문서](https://react.dev/learn/react-compiler/installation)를 참고해 적용하세요.

## ESLint 확장

타입 인지 규칙을 활성화하려면 다음처럼 설정을 확장하세요:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      // tseslint.configs.strictTypeChecked,
      // tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

React 전용 규칙이 필요하면 [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x)과 [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom)를 추가할 수 있습니다.
