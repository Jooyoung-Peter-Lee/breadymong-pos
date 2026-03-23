// 일별 / 제품별 매출 차트 컴포넌트
// props:
//   orders: [{ id, total_amount, status, created_at, order_items: [...] }]
//   취소된 주문(status = '취소')은 집계에서 제외
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'

// 금액 축 포맷 (단위: 원)
const formatAmount = (value) => `${value.toLocaleString('ko-KR')}원`

// 툴팁 금액 포맷
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '13px',
      }}
    >
      <p style={{ margin: '0 0 4px', fontWeight: '600', color: '#333' }}>{label}</p>
      <p style={{ margin: 0, color: '#2563eb' }}>
        {payload[0].value.toLocaleString('ko-KR')}원
      </p>
    </div>
  )
}

export default function SalesChart({ orders }) {
  // 취소 주문 제외
  const activeOrders = orders.filter((o) => o.status !== '취소')

  // ── 일별 매출 집계 ──────────────────────────────────────────
  const dailyMap = activeOrders.reduce((acc, order) => {
    const date = format(new Date(order.created_at), 'MM/dd')
    acc[date] = (acc[date] ?? 0) + order.total_amount
    return acc
  }, {})

  const dailyData = Object.entries(dailyMap)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, amount]) => ({ date, amount }))

  // ── 제품별 매출 집계 ────────────────────────────────────────
  const productMap = activeOrders.flatMap((o) => o.order_items).reduce((acc, item) => {
    const name = item.product_name
    acc[name] = (acc[name] ?? 0) + item.unit_price * item.quantity
    return acc
  }, {})

  const productData = Object.entries(productMap)
    .sort(([, a], [, b]) => b - a) // 매출 내림차순
    .map(([name, amount]) => ({ name, amount }))

  if (activeOrders.length === 0) {
    return (
      <p style={{ color: '#999', textAlign: 'center', padding: '32px 0' }}>
        집계할 주문 데이터가 없습니다
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* 일별 매출 바 차트 */}
      <section>
        <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 16px', color: '#333' }}>
          일별 매출
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={dailyData} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatAmount} tick={{ fontSize: 11 }} width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* 제품별 매출 바 차트 */}
      <section>
        <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 16px', color: '#333' }}>
          제품별 매출
        </h2>
        <ResponsiveContainer width="100%" height={Math.max(240, productData.length * 48)}>
          <BarChart
            data={productData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tickFormatter={formatAmount} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  )
}
