# VPN 배포 및 네트워크 트러블슈팅 로그 (v3.2.9)

**최종 업데이트: v3.2.9 (2026-01-29)**
**작성자:** DevOps Team

이 문서는 NAS 배포 후 VPN 접속 시 발생했던 네트워크 오류(`backend:8000` 리다이렉트)의 원인과 해결 과정을 기록합니다. 향후 유사한 문제 발생 시 참고하시기 바랍니다.

## 1. 문제 증상
- **증상**: 로컬(localhost) 및 LAN(192.168.x.x)에서는 정상 작동하나, VPN(100.x.x.x)에서 접속 시 API 호출이 실패함.
- **에러 메시지**: 브라우저 콘솔에 `ERR_NAME_NOT_RESOLVED` 및 `http://backend:8000/...`으로의 리다이렉트 시도 확인.
- **원인**: 클라이언트 브라우저가 내부망 Docker 컨테이너 주소(`backend:8000`)를 알게 되어 직접 접속을 시도함.

## 2. 근본 원인 분석

### A. 프로덕션 빌드 오염 (Solved in v3.2.3)
- `.env.local`에 정의된 `NEXT_PUBLIC_API_URL=http://localhost:8000`이 프로덕션 빌드에 포함됨.
- **해결**: 배포 스크립트에서 빌드 시 `.env.local` 임시 백업/복원, `.dockerignore` 추가.

### B. CI/CD 파이프라인 하드코딩 (Solved in v3.2.4)
- GitHub Actions 워크플로우에 `NEXT_PUBLIC_API_URL=http://192.168.68.51:8000`이 하드코딩됨.
- **해결**: `build-args` 제거. Middleware를 통한 동적 프록시 사용으로 전환.

### C. Middleware 위치 오류 (Solved in v3.2.6)
- Next.js가 `src/` 디렉토리를 사용하는 경우 `middleware.ts`는 반드시 `src/middleware.ts`에 위치해야 함.
- 기존에 `frontend/middleware.ts`에 있어 빌드에서 제외됨.
- **해결**: 파일 이동.

### D. Trailing Slash 충돌 (Redirect Loop) - **핵심 원인** (Solved in v3.2.9)
- **프론트엔드 (Next.js)**: 기본적으로 URL 끝의 슬래시(`/`)를 제거함 (Normalize).
  - 요청: `/accounts/` -> Next.js 처리 -> `/accounts` (Middleware로 전달)
- **백엔드 (FastAPI)**: Prefix 라우터(`@router.get("/")`)는 슬래시를 요구함.
  - 요청: `/accounts` -> FastAPI -> 307 Redirect to `/accounts/` (Location: `http://backend:8000/accounts/`)
- **결과**: 브라우저가 Docker 내부 URL인 `backend:8000`으로 리다이렉트 받음 -> 접속 불가.

## 3. 최종 해결 방법 (v3.2.9)

프론트엔드와 백엔드의 정책을 **"No Trailing Slash" (슬래시 없음)**로 통일하여 해결했습니다.

### 백엔드 수정 (`backend/app/api/endpoints/accounts.py`)
```python
# 변경 전: @router.get("/") -> /accounts/ 만 허용
# 변경 후: @router.get("")  -> /accounts 허용 (슬래시 없음)
@router.get("", response_model=List[AccountWithUserResponse])
def get_all_accounts(...):
```

### 프론트엔드 설정 (`frontend/next.config.ts`)
```typescript
const nextConfig: NextConfig = {
  // trailingSlash: true 제거 (기본값 false 사용)
  // Next.js가 슬래시를 제거해서 백엔드로 보내도, 백엔드가 받아줌.
};
```

## 4. 배포 체크리스트

배포 시 다음 사항을 반드시 확인하세요.

1. **버전 확인**: `package.json` 버전 업데이트 필수.
2. **시크릿 모드 테스트**: 브라우저 캐시(308 Redirect 등)가 남아있을 수 있으므로 반드시 시크릿 모드 사용.
3. **API 경로**: `/api/proxy/v1/...` 경로를 통해 호출되는지 확인 (`backend:8000` 직접 호출 금지).

## 5. 관련 파일
- `frontend/next.config.ts`
- `frontend/src/middleware.ts`
- `backend/app/api/endpoints/accounts.py`
- `.github/workflows/deploy.yml`
