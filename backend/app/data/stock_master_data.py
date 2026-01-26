"""
국내주식 종목 마스터 데이터 (간소화 버전)
실제 환경에서는 pykrx 또는 KRX API를 통해 동적으로 가져올 수 있습니다.
"""

# 주요 종목 샘플 데이터
STOCK_MASTER_DATA = [
    # KOSPI 주요 종목
    {"code": "005930", "name": "삼성전자", "market": "KOSPI"},
    {"code": "000660", "name": "SK하이닉스", "market": "KOSPI"},
    {"code": "035420", "name": "NAVER", "market": "KOSPI"},
    {"code": "005380", "name": "현대차", "market": "KOSPI"},
    {"code": "000270", "name": "기아", "market": "KOSPI"},
    {"code": "051910", "name": "LG화학", "market": "KOSPI"},
    {"code": "006400", "name": "삼성SDI", "market": "KOSPI"},
    {"code": "035720", "name": "카카오", "market": "KOSPI"},
    {"code": "028260", "name": "삼성물산", "market": "KOSPI"},
    {"code": "068270", "name": "셀트리온", "market": "KOSPI"},
    {"code": "207940", "name": "삼성바이오로직스", "market": "KOSPI"},
    {"code": "105560", "name": "KB금융", "market": "KOSPI"},
    {"code": "055550", "name": "신한지주", "market": "KOSPI"},
    {"code": "012330", "name": "현대모비스", "market": "KOSPI"},
    {"code": "066570", "name": "LG전자", "market": "KOSPI"},
    {"code": "003550", "name": "LG", "market": "KOSPI"},
    {"code": "017670", "name": "SK텔레콤", "market": "KOSPI"},
    {"code": "096770", "name": "SK이노베이션", "market": "KOSPI"},
    {"code": "034730", "name": "SK", "market": "KOSPI"},
    {"code": "009150", "name": "삼성전기", "market": "KOSPI"},
    
    # KOSDAQ 주요 종목
    {"code": "247540", "name": "에코프로비엠", "market": "KOSDAQ"},
    {"code": "091990", "name": "셀트리온헬스케어", "market": "KOSDAQ"},
    {"code": "086520", "name": "에코프로", "market": "KOSDAQ"},
    {"code": "066970", "name": "엘앤에프", "market": "KOSDAQ"},
    {"code": "214150", "name": "클래시스", "market": "KOSDAQ"},
    {"code": "263750", "name": "펄어비스", "market": "KOSDAQ"},
    {"code": "095340", "name": "ISC", "market": "KOSDAQ"},
    {"code": "112040", "name": "위메이드", "market": "KOSDAQ"},
    {"code": "293490", "name": "카카오게임즈", "market": "KOSDAQ"},
    {"code": "328130", "name": "루닛", "market": "KOSDAQ"},
]
