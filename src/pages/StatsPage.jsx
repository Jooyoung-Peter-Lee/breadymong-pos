// [Phase 3] 매출 통계 + 엑셀 다운로드 페이지
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { format, subDays } from 'date-fns'
import useOrdersByDateRange from '../hooks/useOrdersByDateRange'
import SalesChart from '../components/SalesChart'

// 오늘 날짜 (yyyy-MM-dd)
const today = format(new Date(), 'yyyy-MM-dd')
// 기본 시작일: 오늘 기준 7일 전
const defaultStart = format(subDays(new Date(), 6), 'yyyy-MM-dd')

export default function StatsPage() {
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(today)

  const { orders, loading, error, fetchOrders } = useOrdersByDateRange()

  // 취소 주문 제외 — SalesChart / 엑셀 모두 동일 기준 적용
  const activeOrders = orders.filter((o) => o.status !== '취소')

  // ── 조회 ────────────────────────────────────────────────────
  const handleSearch = () => {
    if (startDate > endDate) return
    fetchOrders(startDate, endDate)
  }

  // ── 엑셀 다운로드 ───────────────────────────────────────────
  const handleExcelDownload = () => {
    if (activeOrders.length === 0) return

    const wb = XLSX.utils.book_new()

    // Sheet 1: 주문 목록 — order_items 수만큼 행 펼쳐서 출력
    const orderRows = [
      ['일시', '주문 ID', '상태', '코드', '제품명', '주문수량', '합계'],
      ...activeOrders.flatMap((o) =>
        o.order_items.map((item) => [
          format(new Date(o.created_at), 'yyyy-MM-dd HH:mm'),
          o.id,
          o.status,
          item.product_code ?? '',
          item.product_name,
          item.quantity,
          o.total_amount,
        ])
      ),
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(orderRows), '주문 목록')

    // Sheet 2: 제품별 집계
    const productMap = activeOrders
      .flatMap((o) => o.order_items)
      .reduce((acc, item) => {
        if (!acc[item.product_name]) acc[item.product_name] = { quantity: 0, amount: 0 }
        acc[item.product_name].quantity += item.quantity
        acc[item.product_name].amount  += item.unit_price * item.quantity
        return acc
      }, {})

    const productRows = [
      ['제품명', '수량 합계', '매출 합계(원)'],
      ...Object.entries(productMap)
        .sort(([, a], [, b]) => b.amount - a.amount)
        .map(([name, { quantity, amount }]) => [name, quantity, amount]),
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(productRows), '제품별 집계')

    XLSX.writeFile(wb, `breadymong_매출_${startDate}_${endDate}.xlsx`)
  }

  // 총 매출 합계
  const totalAmount = activeOrders.reduce((sum, o) => sum + o.total_amount, 0)

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 20px' }}>
        매출 통계
      </h1>

      {/* 날짜 범위 선택 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'flex-end',
          marginBottom: '24px',
          padding: '16px',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>시작일</label>
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              minHeight: '48px',
              padding: '0 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '15px',
              background: '#fff',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>종료일</label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            max={today}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              minHeight: '48px',
              padding: '0 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '15px',
              background: '#fff',
            }}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || startDate > endDate}
          style={{
            minHeight: '48px',
            padding: '0 24px',
            border: 'none',
            borderRadius: '6px',
            background: loading || startDate > endDate ? '#aaa' : '#2563eb',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading || startDate > endDate ? 'not-allowed' : 'pointer',
            touchAction: 'manipulation',
          }}
        >
          {loading ? '조회 중...' : '조회'}
        </button>
      </div>

      {/* 에러 */}
      {error && <p style={{ color: '#e53e3e', marginBottom: '16px' }}>{error}</p>}

      {/* 결과 영역 */}
      {orders.length > 0 && (
        <>
          {/* 요약 + 엑셀 다운로드 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              padding: '16px',
              background: '#f0f4ff',
              borderRadius: '8px',
            }}
          >
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#555' }}>
                {startDate} ~ {endDate} 총 매출 ({activeOrders.length}건)
              </p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#1a1a1a' }}>
                {totalAmount.toLocaleString('ko-KR')}원
              </p>
            </div>
            <button
              onClick={handleExcelDownload}
              disabled={activeOrders.length === 0}
              style={{
                minHeight: '48px',
                padding: '0 20px',
                border: '1px solid #2563eb',
                borderRadius: '6px',
                background: '#fff',
                color: '#2563eb',
                fontSize: '15px',
                fontWeight: '600',
                cursor: activeOrders.length === 0 ? 'not-allowed' : 'pointer',
                touchAction: 'manipulation',
              }}
            >
              엑셀 다운로드
            </button>
          </div>

          {/* 차트 */}
          <SalesChart orders={activeOrders} />
        </>
      )}

      {/* 조회 후 결과 없음 */}
      {!loading && orders.length === 0 && activeOrders.length === 0 && error === null && (
        <p style={{ color: '#999', textAlign: 'center', padding: '32px 0' }}>
          날짜 범위를 선택하고 조회 버튼을 눌러주세요
        </p>
      )}
    </div>
  )
}
