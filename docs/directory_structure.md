# 📂 Directory Structure

이 문서는 FAM 프로젝트의 파일 구조와 각 디렉토리의 역할을 설명합니다.

## 📁 Root
- `backend/`: FastAPI 기반 서버 애플리케이션.
- `frontend/`: Next.js 기반 웹UI 애플리케이션.
- `docs/`: 기술 문서, 가이드, API 명세 등.
- `scripts/`: DB 마이그레이션이나 초기화 등을 위한 유틸리티 스크립트.
- `tests/`: 백엔드 로직 검증을 위한 테스트 코드.
- `manage.sh`: 서비스 시작/중지/로그 조회를 위한 관리 셸 스크립트.
- `plan.md`: 현재 진행 상황을 관리하는 로드맵.
- `prd.md`: 프로젝트 전체 요구사항 정의서.

## 📁 backend/app/
- `api/`: REST API 엔드포인트 정의 (Router).
- `core/`: 설정(Config), 보안(Encryption), KIS API 클라이언트 등 핵심 모듈.
- `db/`: 데이터베이스 연결 및 세션 관리.
- `models/`: SQLAlchemy DB 스키마.
- `schemas/`: Pydantic 기반 데이터 검증 모델 (DTO).
- `services/`: 리밸런싱 계산, 스케줄러 등 비즈니스 로직.
- `data/`: 종목 마스터 데이터 등 정적 데이터.

## 📁 frontend/src/
- `app/`: Next.js App Router (페이지 레이아웃 및 라우팅).
- `components/`: 재사용 가능한 UI 컴포넌트 및 모달.
- `context/`: 전역 상태 관리 (계좌 선택 등).
- `services/`: 백엔드 API와의 통신 로직 (`api.ts`).
- `lib/`: 유틸리티 함수 (`utils.ts`).

---

## 🏗 작업 시 유의사항
1. **신규 기능 추가 시**: `backend/app/api/endpoints/`에 라우터를 추가하고, 필요하다면 `models/`와 `schemas/`를 업데이트하세요.
2. **UI 수정 시**: `components/` 내의 관련 모달이나 컴포넌트를 먼저 확인하여 중복 개발을 방지하세요.
3. **데이터 흐름**: UI -> `frontend/src/services/api.ts` -> Backend API -> `backend/app/services/` -> DB / KIS API 순으로 흐릅니다.
