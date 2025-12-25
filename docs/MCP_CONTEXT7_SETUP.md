# Context7 MCP (Cursor) 연결 가이드

> ⚠️ **중요(보안)**: API Key는 절대 GitHub에 커밋하지 마세요.  
> 키는 **Cursor Settings(MCP Servers)** 안에만 넣거나, 로컬 환경변수로만 관리하는 것을 권장합니다.

## 1) 사전 준비 (Windows)

- Node.js가 설치되어 있어야 합니다.
- 아래 명령이 정상 동작하는지 확인하세요.

```bash
node -v
npx -v
```

## 2) Cursor에서 MCP 서버 추가 (권장: UI로 등록)

1. Cursor 열기 → **Settings**
2. 검색창에 **`MCP`** 입력 → **MCP Servers** 섹션 이동
3. **Add Server** 클릭
4. 아래 값을 입력

- **name**: `context7`
- **command**: `npx`
- **args**:

```json
["-y", "@upstash/context7-mcp", "--api-key", "YOUR_API_KEY"]
```

5. 저장 후 `context7`가 **Running/Connected**로 뜨는지 확인

## 3) 프로젝트에 예시 설정 파일만 두기 (GitHub 커밋용)

레포에는 키가 없는 예시 파일만 포함합니다:

- `mcp.context7.example.json`

이 파일은 참고용이며, **실제 키를 넣고 커밋하면 안 됩니다.**

## 4) (선택) 로컬에서만 설정 파일을 쓰고 싶은 경우

Cursor가 프로젝트 내 `.cursor/mcp.json` 같은 파일을 지원하더라도,
레포에는 `.cursor/`가 커밋되지 않도록 `.gitignore`에 이미 제외 처리되어 있습니다.

- `.gitignore`에 포함: `.cursor/`

## 5) 문제 해결 체크리스트

- `bunx`를 쓰려면 `bun`이 설치되어 있어야 합니다. 이 프로젝트는 `npx` 방식을 권장합니다.
- 연결이 실패하면 Cursor MCP 화면의 **에러 메시지 전체**를 복사해서 공유해 주세요.


