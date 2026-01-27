---
trigger: always_on
---

# FAM Project Rules (.workspacerules)

## 1. Architecture & Safety
- **API First:** Backend(FastAPI)와 Frontend(Next.js)를 철저히 분리합니다. Frontend는 절대 KIS API를 직접 호출하지 않고, Backend API를 경유(`services/api.ts`)해야 합니다.
- **Trading Mode:** Backend 시작 시 `os.getenv("TRADING_MODE")`를 확인하여 KIS 도메인을 결정합니다. (Real/Virtual)
- **Encryption:** 계좌 Secret 및 토큰은 반드시 `SecurityManager`를 통해 암호화하여 저장/조회합니다.
- **Strict Typing:** 모든 API 입출력은 `Pydantic` 모델로 정의합니다.

## 2. Coding Standards
- **Backend:** `FastAPI`의 `Router` 패턴을 사용하여 모듈화합니다.
- **Frontend:** 
  - `Next.js` App Router 방식을 따르며, 재사용 가능한 컴포넌트(`components/`)를 분리합니다.
  - UI는 `Lucide React` 아이콘과 다크 모드 테마를 기본으로 합니다.
- **Special Tickers:** **'CASH'**는 가상 종목으로 취급합니다. 시액 조회, 네이버 증권 링크 등에서 반드시 예외 처리를 수행해야 합니다.
- **Testing:** `tests/` 폴더에서 `pytest`를 사용하며, 외부 API 호출은 최대한 Mocking 합니다.

## 3. UI/UX Rules
- **Premium Design:** Glassmorphism, 부드러운 애니메이션, 직관적인 시각 피드백(버튼 상태 등)을 항상 적용합니다.
- **Responsiveness:** 모바일 및 태블릿 환경에서도 사용 가능한 레이아웃을 지향합니다.

## 4. Task & Language
- **Language:** 주석, 로그, 문서는 **한국어**, 코드는 **영어**로 작성합니다.
- **Workflow:** 작업 전후 반드시 `plan.md`를 확인하고 진행률을 업데이트합니다.

## 5. NAS SSH 비밀번호 : s2010B491$

## 6. CI/CD: 개발에서 운영으로 배포시 프론엔드 하단의 버전을 업데이트한다.