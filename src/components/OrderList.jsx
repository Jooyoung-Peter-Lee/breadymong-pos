// 주문 목록 테이블 컴포넌트
// props:
//   orders: [{ id, total_amount, status, created_at, order_items: [...] }]
//   onCancel(orderId): 주문 취소 처리
//   onEdit(order): 주문 수정 모달/폼 열기
import { format } from 'date-fns'

export default function OrderList({ orders, onCancel, onEdit }) {
  if (orders.length === 0) {
    return (
      <p style={{ color: '#999', textAlign: 'center', padding: '32px 0' }}>
        오늘 주문 내역이 없습니다
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {orders.map((order) => {
        const isCancelled = order.status === '취소'

        return (
          <div
            key={order.id}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px',
              background: isCancelled ? '#f9f9f9' : '#fff',
              opacity: isCancelled ? 0.55 : 1,
            }}
          >
            {/* 상단: 주문 시간 + 상태 배지 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#888' }}>
                {format(new Date(order.created_at), 'HH:mm')}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: isCancelled ? '#fee2e2' : '#dcfce7',
                  color:      isCancelled ? '#991b1b' : '#166534',
                }}
              >
                {order.status}
              </span>
            </div>

            {/* 중단: 제품 목록 */}
            <ul
              style={{
                listStyle: 'none',
                margin: '0 0 12px',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {order.order_items.map((item) => (
                <li
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    color: '#333',
                    textDecoration: isCancelled ? 'line-through' : 'none',
                  }}
                >
                  <span>
                    {item.product_name} × {item.quantity}
                  </span>
                  <span>
                    {(item.unit_price * item.quantity).toLocaleString('ko-KR')}원
                  </span>
                </li>
              ))}
            </ul>

            {/* 하단: 합계 + 버튼 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #f0f0f0',
                paddingTop: '10px',
              }}
            >
              {/* 합계 금액 */}
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>
                {order.total_amount.toLocaleString('ko-KR')}원
              </span>

              {/* 취소 / 수정 버튼 */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onEdit(order)}
                  disabled={isCancelled}
                  style={{
                    minWidth: '64px',
                    minHeight: '48px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    background: '#fff',
                    color: isCancelled ? '#bbb' : '#334155',
                    fontSize: '14px',
                    cursor: isCancelled ? 'not-allowed' : 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  수정
                </button>
                <button
                  onClick={() => onCancel(order.id)}
                  disabled={isCancelled}
                  style={{
                    minWidth: '64px',
                    minHeight: '48px',
                    border: 'none',
                    borderRadius: '6px',
                    background: isCancelled ? '#e5e7eb' : '#fee2e2',
                    color: isCancelled ? '#bbb' : '#991b1b',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isCancelled ? 'not-allowed' : 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
