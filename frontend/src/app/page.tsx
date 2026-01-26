"use client";

import { useAccount } from "@/context/AccountContext";
import { fetchBalance, fetchAccountPortfolio, TargetPortfolio, TradeSuggestion } from "@/services/api";
import { useEffect, useState } from "react";
import { RefreshCcw, Wallet, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { TradeModal } from "@/components/TradeModal";

export default function Dashboard() {
  const { selectedAccount, accounts, isLoading: isContextLoading } = useAccount();
  const [balance, setBalance] = useState<any>(null);
  const [targets, setTargets] = useState<TargetPortfolio[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<TradeSuggestion | null>(null);

  const loadBalance = async () => {
    setError(null);
    if (!selectedAccount) {
      // "전체" 모드: 모든 계좌의 잔고를 합산
      if (accounts.length === 0) return;

      setIsLoading(true);
      try {
        // 모든 계좌의 잔고를 가져오기
        const allBalances = await Promise.all(
          accounts.map(acc => fetchBalance(acc.id).catch((e) => {
            console.error(`Acc ${acc.id} error:`, e);
            return null;
          }))
        );

        const validBalances = allBalances.filter(b => b !== null);
        if (validBalances.length === 0) {
          setError("계좌 정보를 불러올 수 없습니다. API 설정을 확인해주세요.");
          setBalance(null);
          return;
        }

        // 메트릭 합산
        let totalStockValuation = 0;
        let totalPurchaseAmount = 0;
        let totalProfitLoss = 0;
        let totalAsset = 0;
        let totalDeposit = 0;
        let totalD2Deposit = 0;
        let totalOrderableAmount = 0;

        // 종목별 합산을 위한 Map (종목코드 기준)
        const holdingsMap = new Map<string, any>();

        validBalances.forEach((bal: any) => {
          const summary = bal?.output2?.[0] || {};
          const holdings = bal?.output1 || [];

          // 메트릭 합산
          totalStockValuation += parseFloat(summary.scts_evlu_amt || "0");
          totalPurchaseAmount += parseFloat(summary.pchs_amt_smtl_amt || "0");
          totalProfitLoss += parseFloat(summary.evlu_pfls_smtl_amt || "0");
          totalAsset += parseFloat(summary.tot_evlu_amt || "0");
          totalDeposit += parseFloat(summary.dnca_tot_amt || "0");
          totalD2Deposit += parseFloat(summary.prvs_rcdl_excc_amt || "0");
          totalOrderableAmount += parseFloat(summary.nxdy_excc_amt || "0");

          // 보유 종목 합산 (종목코드 기준)
          holdings.forEach((h: any) => {
            const code = h.pdno;
            if (!code) return;

            if (holdingsMap.has(code)) {
              const existing = holdingsMap.get(code);
              existing.hldg_qty = (parseInt(existing.hldg_qty) + parseInt(h.hldg_qty || "0")).toString();
              existing.pchs_amt = (parseInt(existing.pchs_amt) + parseInt(h.pchs_amt || "0")).toString();
              existing.evlu_amt = (parseInt(existing.evlu_amt) + parseInt(h.evlu_amt || "0")).toString();
              existing.evlu_pfls_amt = (parseInt(existing.evlu_pfls_amt) + parseInt(h.evlu_pfls_amt || "0")).toString();

              // 평균 매입가 재계산
              const totalQty = parseInt(existing.hldg_qty);
              const totalPchsAmt = parseInt(existing.pchs_amt);
              existing.pchs_avg_pric = totalQty > 0 ? (totalPchsAmt / totalQty).toFixed(0) : "0";

              // 수익률 재계산
              existing.evlu_pfls_rt = totalPchsAmt > 0
                ? ((parseInt(existing.evlu_pfls_amt) / totalPchsAmt) * 100).toFixed(2)
                : "0.00";
            } else {
              holdingsMap.set(code, { ...h });
            }
          });
        });

        // 합산된 데이터 구성
        const aggregatedBalance = {
          output1: Array.from(holdingsMap.values()),
          output2: [{
            scts_evlu_amt: totalStockValuation.toString(),
            pchs_amt_smtl_amt: totalPurchaseAmount.toString(),
            evlu_pfls_smtl_amt: totalProfitLoss.toString(),
            tot_evlu_amt: totalAsset.toString(),
            dnca_tot_amt: totalDeposit.toString(),
            prvs_rcdl_excc_amt: totalD2Deposit.toString(),
            nxdy_excc_amt: totalOrderableAmount.toString(),
          }]
        };

        setBalance(aggregatedBalance);
      } catch (e) {
        console.error("Failed to load balances", e);
        setError("데이터를 합산하는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 개별 계좌 모드
    setIsLoading(true);
    try {
      const data = await fetchBalance(selectedAccount.id);
      setBalance(data);
    } catch (e: any) {
      console.error("Failed to load balance", e);
      setError(e.response?.data?.detail || "잔고를 불러오지 못했습니다. 계좌 정보를 확인하세요.");
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTargets = async () => {
    if (selectedAccount) {
      try {
        const data = await fetchAccountPortfolio(selectedAccount.id);
        setTargets(data);
      } catch (e) {
        console.error("Failed to fetch targets", e);
        setTargets([]);
      }
    } else {
      setTargets([]);
    }
  };

  useEffect(() => {
    loadBalance();
    loadTargets();
  }, [selectedAccount, accounts]);

  if (isContextLoading) {
    return <div className="p-10 text-center text-muted-foreground animate-pulse">데이터를 불러오는 중...</div>;
  }

  if (accounts.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 py-20">
        <div className="rounded-full bg-muted p-6">
          <Wallet className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">등록된 계좌가 없습니다</h2>
        <p className="text-muted-foreground text-center">
          설정 &gt; 계좌 관리에서 한국투자증권 계좌를 먼저 등록해주세요.<br />
          (VIRTUAL 모드인 경우 모의투자 계좌 정보를 입력하세요)
        </p>
      </div>
    );
  }

  // Parse Data
  const summary = balance?.output2?.[0] || {};
  const holdings = balance?.output1 || [];

  // Metrics
  const stockValuation = parseFloat(summary.scts_evlu_amt || "0");
  const purchaseAmountTotal = parseFloat(summary.pchs_amt_smtl_amt || "0");
  const profitLossTotal = parseFloat(summary.evlu_pfls_smtl_amt || "0");
  const profitRate = purchaseAmountTotal > 0 ? (profitLossTotal / purchaseAmountTotal * 100) : 0;
  const totalAsset = parseFloat(summary.tot_evlu_amt || "0");
  const deposit = parseFloat(summary.dnca_tot_amt || "0");
  const d2Deposit = parseFloat(summary.prvs_rcdl_excc_amt || "0");
  const orderableAmount = parseFloat(summary.nxdy_excc_amt || "0");

  const handleTrade = (item: any, action: "BUY" | "SELL") => {
    const currentPrice = parseInt(item.prpr || "0");
    const currentQty = parseInt(item.hldg_qty || "0");
    const evalAmt = parseInt(item.evlu_amt || "0");

    // Construct a temporary suggestion object for the modal
    const suggestion: TradeSuggestion = {
      stock_code: item.pdno,
      stock_name: item.prdt_name,
      current_qty: currentQty,
      current_price: currentPrice,
      current_value: evalAmt,
      target_value: 0, // Not relevant for manual trade
      diff_value: 0,   // Not relevant
      suggested_qty: action === "BUY" ? 0 : currentQty, // Default to 0 for buy, full holding for sell
      action: action
    };

    setSelectedSuggestion(suggestion);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">자산 현황</h1>
          <p className="text-sm text-muted-foreground">
            {selectedAccount ? `${selectedAccount.alias} 계좌의 실시간 잔고입니다.` : "모든 계좌의 합산 데이터입니다."}
          </p>
        </div>
        <button
          onClick={loadBalance}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-md active:scale-95"
        >
          <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-red-800">API 호출 오류</p>
            <p className="text-xs text-red-700 leading-relaxed">{error}</p>
            <p className="text-[10px] text-red-500 mt-2 font-medium italic">
              * KIS API 키가 유효한지, 그리고 TRADING_MODE(Real/Virtual)가 계좌 유형과 일치하는지 확인하세요.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Row 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white border border-border p-6 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">주식 평가금액</p>
          <p className="text-2xl font-bold text-foreground">{stockValuation.toLocaleString()}원</p>
        </div>
        <div className="rounded-xl bg-indigo-50/30 border border-indigo-100 p-6 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-semibold text-indigo-600/70 mb-2 uppercase tracking-wider">매입금액 합계</p>
          <p className="text-2xl font-bold text-foreground">{purchaseAmountTotal.toLocaleString()}원</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-6 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">평가손익 합계</p>
          <p className={`text-2xl font-bold ${profitLossTotal >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
            {profitLossTotal >= 0 ? '+' : ''}{profitLossTotal.toLocaleString()}원
          </p>
        </div>
        <div className="rounded-xl bg-card border border-border p-6 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">수익률</p>
          <p className={`text-2xl font-bold ${profitRate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
            {profitRate >= 0 ? '+' : ''}{profitRate.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Metrics Row 2 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-6 shadow-sm">
          <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">총 평가 자산</p>
          <p className="text-2xl font-bold text-primary">{totalAsset.toLocaleString()}원</p>
        </div>
        <div className="rounded-xl bg-white border border-border p-6 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">예수금</p>
          <p className="text-2xl font-bold text-foreground">{deposit.toLocaleString()}원</p>
        </div>
        <div className="rounded-xl bg-white border border-border p-6 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">D+2 예수금</p>
          <p className="text-2xl font-bold text-foreground">{d2Deposit.toLocaleString()}원</p>
        </div>
        <div className="rounded-xl bg-amber-50/50 border border-amber-200 p-6 shadow-sm">
          <p className="text-xs font-semibold text-amber-700 mb-2 uppercase tracking-wider">주문가능 수량</p>
          <p className="text-2xl font-bold text-foreground">{orderableAmount.toLocaleString()}원</p>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">보유 종목 리스트</h3>
        </div>
        {holdings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-4 text-left font-medium">종목명</th>
                  <th className="px-4 py-4 text-center font-medium">수량</th>
                  <th className="px-4 py-4 text-right font-medium">평균단가</th>
                  <th className="px-4 py-4 text-right font-medium">현재가</th>
                  <th className="px-4 py-4 text-right font-medium">등락</th>
                  <th className="px-4 py-4 text-right font-medium">매입금액</th>
                  <th className="px-4 py-4 text-right font-medium">평가금액</th>
                  <th className="px-4 py-4 text-right font-medium">평가손익</th>
                  <th className="px-4 py-4 text-right font-medium">수익률</th>
                  <th className="px-4 py-4 text-center font-medium text-xs text-muted-foreground">
                    주식비중<br />(평가액)
                  </th>
                  <th className="px-4 py-4 text-center font-medium text-xs text-muted-foreground">
                    자산비중<br />(총자산)
                  </th>
                  <th className="px-4 py-4 text-center font-medium text-xs text-muted-foreground">
                    목표비중
                  </th>
                  <th className="px-4 py-4 text-center font-medium">주문</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {holdings.map((h: any, i: number) => {
                  const currentPrice = parseInt(h.prpr || "0");
                  const qty = parseInt(h.hldg_qty || "0");
                  const avgPrice = parseFloat(h.pchs_avg_pric || "0");
                  const purchaseAmount = parseInt(h.pchs_amt || "0");
                  const profitLoss = parseInt(h.evlu_pfls_amt || "0");
                  const profitRateValue = parseFloat(h.evlu_pfls_rt || "0");
                  const changeRate = parseFloat(h.fltt_rt || "0");
                  const evalAmt = parseInt(h.evlu_amt || "0");

                  // Weights Calculation
                  const stockWeight = stockValuation > 0
                    ? (evalAmt / stockValuation) * 100
                    : 0;
                  const assetWeight = totalAsset > 0
                    ? (evalAmt / totalAsset * 100)
                    : 0;

                  // Target Weight
                  const targetItem = targets.find(t => t.stock_code === h.pdno);
                  const targetWeight = targetItem ? targetItem.target_percentage : 0;

                  return (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-5">
                        <div className="flex flex-col">
                          {h.pdno === 'CASH' ? (
                            <span className="font-bold text-primary">{h.prdt_name}</span>
                          ) : (
                            <a
                              href={`https://stock.naver.com/domestic/stock/${h.pdno}/price`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-primary hover:underline hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              {h.prdt_name}
                            </a>
                          )}
                          <span className="text-[10px] text-muted-foreground font-mono">{h.pdno}</span>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-center font-medium">{qty.toLocaleString()}주</td>
                      <td className="px-4 py-5 text-right text-muted-foreground">{avgPrice.toLocaleString()}원</td>
                      <td className="px-4 py-5 text-right font-bold">{currentPrice.toLocaleString()}원</td>
                      <td className={`px-4 py-5 text-right font-bold ${changeRate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        {changeRate >= 0 ? '▲' : '▼'}{Math.abs(changeRate).toFixed(2)}%
                      </td>
                      <td className="px-4 py-5 text-right font-medium">{purchaseAmount.toLocaleString()}원</td>
                      <td className="px-4 py-5 text-right font-bold">{evalAmt.toLocaleString()}원</td>
                      <td className={`px-4 py-5 text-right font-bold ${profitLoss >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        {profitLoss >= 0 ? '+' : ''}{profitLoss.toLocaleString()}원
                      </td>
                      <td className={`px-4 py-5 text-right font-black ${profitRateValue >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {profitRateValue >= 0 ? '+' : ''}{profitRateValue}%
                      </td>
                      <td className="px-4 py-5 text-center font-medium">
                        {stockWeight.toFixed(1)}%
                      </td>
                      <td className="px-4 py-5 text-center font-medium text-muted-foreground">
                        {assetWeight.toFixed(1)}%
                      </td>
                      <td className="px-4 py-5 text-center font-medium text-primary">
                        {targetItem ? `${targetWeight}%` : '-'}
                      </td>
                      <td className="px-4 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {selectedAccount && ( // Only show buttons if a specific account is selected (not "All")
                            <>
                              <button
                                onClick={() => handleTrade(h, "BUY")}
                                className="p-1.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                title="매수"
                              >
                                <TrendingUp className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleTrade(h, "SELL")}
                                className="p-1.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                                title="매도"
                              >
                                <TrendingDown className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-20 text-center flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Wallet className="h-6 w-6" />
            </div>
            <p className="text-muted-foreground font-medium">보유한 주식이 없습니다.</p>
          </div>
        )}
      </div>

      {selectedSuggestion && selectedAccount && (
        <TradeModal
          isOpen={!!selectedSuggestion}
          onClose={() => setSelectedSuggestion(null)}
          suggestion={selectedSuggestion}
          account={selectedAccount as any}
          availableCash={deposit}
          onSuccess={() => {
            loadBalance();
          }}
        />
      )}
    </div>
  );
}
