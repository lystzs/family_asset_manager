# 🛠 Local Setup Guide

이 문서는 개발 환경을 처음 설정하는 파트너를 위해 작성되었습니다.

## 1. 전제 조건 (Prerequisites)
- **Python 3.11+**
- **Node.js 20+**
- **Git**

## 2. 백엔드 설정 (Backend Setup)

1. **가상환경 생성 및 활성화**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

2. **패키지 설치**
   ```bash
   pip install -r requirements.txt
   ```

3. **환경 변수 설정 (`.env`)**
   프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 입력합니다:
   ```env
   # 필수: 암호화 키 (AES-256용 32바이트 Base64 문자열)
   # 생성 예시: python -c "import base64, os; print(base64.b64encode(os.urandom(32)).decode())"
   ENCRYPTION_KEY="your_secret_key_here"

   # 선택 (기본값 존재)
   DATABASE_URL="sqlite:///./backend/family_asset.db"
   TRADING_MODE="Real" # "Real" 또는 "Virtual"
   ```

## 3. 프론트엔드 설정 (Frontend Setup)

1. **패키지 설치**
   ```bash
   cd frontend
   npm install
   ```

2. **실행**
   ```bash
   npm run dev
   ```

## 4. 통합 관리 스크립트 (`manage.sh`)

프로젝트 루트의 `manage.sh`를 통해 서비스를 통합 관리할 수 있습니다:

- `chmod +x manage.sh` (최초 1회 실행 권한 부여)
- `./manage.sh start`: 백엔드와 프론트엔드를 백그라운드에서 동시 실행.
- `./manage.sh stop`: 실행 중인 모든 서비스 중지.
- `./manage.sh restart`: 서비스 재시작.
- `./manage.sh logs backend`: 백엔드 로그 실시간 확인.
- `./manage.sh status`: 서비스 상태 확인.

---

## ⚠️ 주의 사항
- **암호화 키**: `ENCRYPTION_KEY`는 한 번 설정하면 변경하지 마세요. 변경 시 DB에 저장된 기존 계좌 정보와 토큰을 해독할 수 없게 됩니다.
- **KIS API**: 실전(Real) 계좌를 사용할 때는 반드시 KIS 본인인증이 완료된 상태여야 합니다.
