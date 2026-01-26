📋 최종 확정 PRD: Family Asset Manager (FAM) v3.0
"API-First Infrastructure for Family Wealth & Quant Trading"

1. 프로젝트 개요 (Overview)
1.1. 미션 (Mission)
가족 자산 관리를 위한 웹 대시보드와 향후 확장될 퀀트 트레이딩 봇이 공용으로 사용할 수 있는 **'고성능 KIS API 프록시 서버(Backend)'**를 구축한다.

1.2. 핵심 철학 (Core Philosophy)
Centralized Gateway: 모든 증권사(KIS) 연결은 오직 FAM Backend를 통해서만 이루어진다. (토큰 관리 및 TPS 제어의 일원화)

API First: 화면(UI)보다 **데이터와 기능(API)**을 먼저 설계한다. 프론트엔드(Streamlit)나 퀀트 봇은 이 API의 소비자(Client)일 뿐이다.

Safety & Isolation:

Human Approval: 매매 신호는 생성하되, 최종 실행은 인간의 승인을 거친다.

Environment: .env 설정을 통해 **모의투자(Mock)**와 실전(Real) 환경을 물리적으로 분리한다.

2. 시스템 아키텍처 (System Architecture)
2.1. 기술 스택 (Tech Stack)
Backend (The Brain): FastAPI (Python 3.11+)

Role: RESTful API 서버, 토큰 관리, 스케줄러, DB 기록.

Lib: Pydantic (검증), SQLAlchemy (ORM), APScheduler (배치).

Frontend (The Face): Streamlit

Role: 자산 현황 시각화, 사용자 승인 버튼, Backend API 호출.

Database: SQLite (초기) -> PostgreSQL (확장 고려).

Security: cryptography (민감정보 암호화).

2.2. 모듈 구조 (Structure)
Plaintext
fam_project/
├── backend/                  # [Server] FastAPI
│   ├── app/
│   │   ├── api/              # Endpoints (v1/account, v1/trade)
│   │   ├── core/             # Config, Security, KIS_Client(Proxy)
│   │   ├── models/           # DB Schema & Pydantic DTO
│   │   └── services/         # Business Logic (Rebalance, Quant)
│   ├── main.py               # Entrypoint
│   └── requirements.txt
├── frontend/                 # [Client] Streamlit
│   ├── pages/                # Dashboard, Settings
│   ├── services/             # API Connector (Call Backend)
│   ├── app.py                # Entrypoint
│   └── requirements.txt
├── data/                     # SQLite DB, Logs
├── .env                      # Secrets (Key, URL)
├── .cursorrules              # AI Guidelines
└── plan.md                   # Roadmap
3. 기능 요구사항 (Functional Requirements)
3.1. KIS API Proxy (Backend Core)
통합 토큰 관리: 서버 메모리 내에서 Access Token을 유지하며, 만료 임박 시 백그라운드에서 자동 갱신한다. 외부(퀀트 봇)에서는 토큰을 신경 쓸 필요가 없다.

TPS Throttling: KIS API 호출 사이에 강제 대기 시간(time.sleep)이나 큐(Queue)를 두어 초당 호출 제한을 준수한다.

표준 API 제공:

GET /v1/account/balance: 통합 잔고 조회 (KRW 환산 포함).

POST /v1/trade/order: 주문 요청 (검증 및 로그 기록).

3.2. 통합 대시보드 (Frontend)
자산 시각화: Backend API를 호출하여 받아온 JSON 데이터를 파이 차트와 테이블로 렌더링한다.

리밸런싱 UI: 목표 비중 설정 후 '분석' 버튼을 누르면, Backend의 계산 로직 결과를 받아와 미리보기(Preview)로 보여준다.

3.3. 확장성 (Quant Support)
외부 연동: 향후 개발될 퀀트 프로젝트는 http://localhost:8000/docs의 명세를 보고 API를 호출하여 매매를 수행할 수 있어야 한다.

로그 태깅: 주문 요청 시 strategy_id를 받아, 어떤 전략(예: 마법공식, 수동매매)에 의한 주문인지 DB에 기록한다.

4. 프로젝트 규칙 & 로드맵 (AI Instruction)
이 내용을 파일로 저장하여 AI에게 주입합니다.

4.1. .cursorrules (AI 행동 강령)
Markdown
# FAM Project Rules (.workspacerules)

## 1. Architecture & Safety
- **API First:** Backend(FastAPI)와 Frontend(Streamlit)를 철저히 분리합니다. Frontend는 절대 KIS API를 직접 호출하지 않고, Backend API를 경유해야 합니다.
- **Trading Mode:** Backend 시작 시 `os.getenv("TRADING_MODE")`를 확인하여 KIS 도메인(Real/Virtual)을 결정합니다.
- **Strict Typing:** 모든 API 입출력(Request/Response)은 `Pydantic` 모델로 정의합니다.

## 2. Coding Standards
- **Backend:** `FastAPI`의 `Router` 패턴을 사용하여 모듈화합니다.
- **Frontend:** `Streamlit`의 `session_state`를 활용하여 API 호출 횟수를 최적화합니다.
- **Testing:** `tests/` 폴더에서 `pytest-mock`을 사용해 외부 API 호출을 차단하고 로직을 검증합니다.

## 3. Task & Language
- **Language:** 주석, 로그, 문서는 **한국어**, 코드는 **영어**로 작성합니다.
- **Workflow:** 작업 전후 반드시 `plan.md`를 확인하고 진행률을 업데이트합니다.
4.2. plan.md (개발 로드맵)
Markdown
# 📋 FAM (API-First) 개발 로드맵

## Phase 1: 백엔드 기초 (Backend Foundation)
- [ ] 프로젝트 폴더 구조 생성 (backend/frontend 분리) 및 `.env` 설정
- [ ] [BE] `FastAPI` 기본 골격 및 `SecurityManager` (암호화) 구현
- [ ] [BE] DB 모델링 (`User`, `Account`, `TradeLog`) 및 `SQLAlchemy` 설정

## Phase 2: KIS 프록시 구축 (The Proxy)
- [ ] [BE] `AuthManager`: 토큰 자동 갱신 및 메모리 캐싱 로직
- [ ] [BE] `KisClient`: KIS API 래퍼(Wrapper) 구현 (Mock 모드 지원)
- [ ] [BE] API 구현: `GET /balance` (잔고 조회), `POST /order` (주문)

## Phase 3: 프론트엔드 연동 (Frontend Integration)
- [ ] [FE] `APIConnector`: Backend와 통신하는 클라이언트 모듈 구현
- [ ] [FE] 계좌 등록 화면 및 대시보드(자산 조회) 구현
- [ ] [FE] 리밸런싱 실행 화면 및 승인 프로세스 구현

## Phase 4: 안정화 및 확장 (Stabilization)
- [ ] [BE] `APScheduler` 적용: 장 시작/종료 시 자동 데이터 수집
- [ ] [Test] 모의투자 환경 End-to-End 테스트