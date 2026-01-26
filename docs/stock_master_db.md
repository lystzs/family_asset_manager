# 국내주식 종목 마스터 DB 관리 시스템

## 📋 개요

pykrx를 사용하여 KRX에서 전체 종목 데이터를 가져와 데이터베이스에 저장하고, 매주 일요일 자동으로 동기화하는 시스템입니다.

## 🗂️ 구조

### 1. Database Model
```python
# backend/app/models/stock.py
class Stock:
    - id: 자동증가 ID
    - code: 종목코드 (6자리, 유니크)
    - name: 종목명
    - market: 시장구분 (KOSPI/KOSDAQ)
    - created_at: 생성일시
    - updated_at: 수정일시
```

### 2. Service Layer
```python
# backend/app/services/stock_master.py
class StockMasterService:
    - sync_stock_master()    # KRX → DB 동기화
    - get_all_stocks()       # 전체 종목 조회
    - search_stocks()        # 종목 검색
    - get_stock_by_code()    # 코드로 조회
    - get_stock_count()      # 통계
```

### 3. API Endpoints
```bash
GET  /v1/stocks/              # 전체 종목
GET  /v1/stocks/search?q=삼성  # 종목 검색
GET  /v1/stocks/stats         # 통계
GET  /v1/stocks/005930        # 특정 종목
POST /v1/stocks/sync          # 수동 동기화
```

### 4. Scheduler
```python
# backend/app/services/scheduler.py
- Job: 매주 일요일 오전 2시
- Function: sync_stock_master_job()
- 자동으로 KRX 최신 데이터 동기화
```

## 🚀 사용 방법

### Backend API
```python
from backend.app.services.stock_master import StockMasterService

# 전체 조회
stocks = StockMasterService.get_all_stocks()
# [{"code": "005930", "name": "삼성전자", "market": "KOSPI"}, ...]

# 검색
results = StockMasterService.search_stocks("삼성", limit=10)

# 특정 종목
stock = StockMasterService.get_stock_by_code("005930")

# 통계
stats = StockMasterService.get_stock_count()
# {"total": 2500, "kospi": 900, "kosdaq": 1600}

# 수동 동기화
result = StockMasterService.sync_stock_master()
# {"added": 10, "updated": 5, "total": 2500}
```

### REST API
```bash
# 전체 종목 조회
curl http://localhost:8000/v1/stocks/

# 종목 검색
curl http://localhost:8000/v1/stocks/search?q=삼성&limit=10

# 통계
curl http://localhost:8000/v1/stocks/stats

# 수동 동기화
curl -X POST http://localhost:8000/v1/stocks/sync
```

### Frontend TypeScript
```typescript
import { api } from '@/services/api';

// 종목 검색
const searchStocks = async (keyword: string) => {
  const response = await api.get(`/stocks/search?q=${keyword}`);
  return response.data;
};

// 전체 종목
const getAllStocks = async () => {
  const response = await api.get('/stocks/');
  return response.data;
};
```

## ⚙️ 동작 방식

### 초기 실행
1. 서버 시작 시 `Stock` 테이블 자동 생성
2. 첫 조회 시 DB에 데이터가 없으면 자동 동기화 실행
3. Fallback 데이터 (30개 주요 종목) 준비

### 주간 동기화
1. 매주 일요일 오전 2시 자동 실행
2. KRX에서 최신 종목 데이터 가져오기
3. 신규 종목 추가, 기존 종목 업데이트
4. 로그 기록

### Fallback 메커니즘
```python
# pykrx 실패 시 → 정적 데이터 (30개 주요 종목)
# backend/app/data/stock_master_data.py
STOCK_MASTER_DATA = [
    {"code": "005930", "name": "삼성전자", "market": "KOSPI"},
    # ... 30개 주요 종목
]
```

## 📊 데이터 흐름

```
KRX (pykrx)
    ↓
StockMasterService._fetch_from_krx()
    ↓
DB 동기화 (추가/업데이트)
    ↓
API 조회 (DB에서 빠르게 응답)
    ↓
Frontend/Client
```

## 🔄 자동화 스케줄

| 작업 | 주기 | 시간 | 설명 |
|------|------|------|------|
| **종목 동기화** | 매주 | 일요일 02:00 | KRX 최신 데이터 |
| Tick (예시) | 매분 | - | 시스템 모니터링 |

## 💡 장점

1. ✅ **성능**: DB 조회로 빠른 응답 (메모리 캐시 불필요)
2. ✅ **안정성**: 서버 재시작해도 데이터 유지
3. ✅ **최신성**: 자동 주간 업데이트
4. ✅ **검색**: SQL LIKE 쿼리로 유연한 검색
5. ✅ **확장성**: 필요 시 추가 필드 확장 가능
6. ✅ **Fallback**: pykrx 실패 시에도 동작

## 🔧 관리

### 수동 동기화
```bash
# API로 즉시 동기화
curl -X POST http://localhost:8000/v1/stocks/sync
```

### 통계 확인
```bash
curl http://localhost:8000/v1/stocks/stats
# {"total": 2526, "kospi": 945, "kosdaq": 1581}
```

### DB 직접 확인
```bash
sqlite3 backend/app.db
> SELECT COUNT(*) FROM stocks;
> SELECT * FROM stocks WHERE name LIKE '%삼성%';
```

## 📝 향후 개선 사항

1. 상장폐지 종목 자동 삭제
2. 종목 상세 정보 추가 (산업군, 시가총액 등)
3. 변경 이력 추적
4. 실시간 신규 상장 알림
5. ETF, ETN 별도 관리

## 🎯 결론

DB 기반 관리로 안정적이고 빠른 종목 조회가 가능하며, 자동 주간 업데이트로 최신 상태를 유지합니다.
