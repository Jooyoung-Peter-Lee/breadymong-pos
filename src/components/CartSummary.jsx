// 장바구니 및 합계 금액 표시 컴포넌트
// props:
//   cart: [{ product_id, product_name, product_category, unit_price, quantity }]
//   onRemove(productId): 아이템 제거
//   onQuantityChange(productId, delta): 수량 조절 (+1 / -1). 수량 0 이하 시 제거
//   onComplete(): 결제 완료 처리
//   onClear(): 장바구니 전체 초기화
//   completing: 결제 처리 중 여부 (중복 제출 방지)

export default function CartSummary({ cart, onRemove, onQuantityChange, onComplete, onClear, completing }) {
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  )

  const isCompleteDisabled = cart.length === 0 || completing

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* 장바구니가 비어있을 때 */}
      {cart.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '16px 0' }}>
          제품을 선택해주세요
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cart.map((item) => (
            <li
              key={item.product_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                border: '1px solid #eee',
                borderRadius: '6px',
                background: '#fafafa',
              }}
            >
              {/* 제품명 */}
              <span style={{ flex: 1, fontSize: '15px', fontWeight: '500' }}>
                {item.product_name}
              </span>

              {/* 수량 조절: [ − ] [ 수량 ] [ + ] */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() =>
                    item.quantity === 1
                      ? onRemove(item.product_id)
                      : onQuantityChange(item.product_id, -1)
                  }
                  style={{
                    minWidth: '48px',
                    minHeight: '48px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: '#fff',
                    color: item.quantity === 1 ? '#e53e3e' : '#333',
                    fontSize: '18px',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                  aria-label={`${item.product_name} 수량 줄이기`}
                >
                  {item.quantity === 1 ? '×' : '−'}
                </button>
                <span
                  style={{
                    minWidth: '32px',
                    textAlign: 'center',
                    fontSize: '15px',
                    fontWeight: '600',
                  }}
                >
                  {item.quantity}
                </span>
                <button
                  onClick={() => onQuantityChange(item.product_id, +1)}
                  style={{
                    minWidth: '48px',
                    minHeight: '48px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: '#fff',
                    color: '#333',
                    fontSize: '18px',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                  aria-label={`${item.product_name} 수량 늘리기`}
                >
                  +
                </button>
              </div>

              {/* 소계 — 우측 정렬 고정폭 */}
              <span
                style={{
                  minWidth: '80px',
                  textAlign: 'right',
                  fontSize: '14px',
                  color: '#333',
                }}
              >
                {(item.unit_price * item.quantity).toLocaleString('ko-KR')}원
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* 합계 금액 — 페이코 단말 입력 시 한눈에 보이도록 가장 크게 표시 */}
      <div
        style={{
          textAlign: 'center',
          padding: '16px',
          background: '#f0f4ff',
          borderRadius: '8px',
        }}
      >
        <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#555' }}>합계</p>
        <p style={{ margin: 0, fontSize: '40px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-1px' }}>
          {totalAmount.toLocaleString('ko-KR')}원
        </p>
      </div>

      {/* 하단 버튼 영역 */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {/* 전체 초기화 */}
        <button
          onClick={onClear}
          disabled={cart.length === 0}
          style={{
            flex: 1,
            minHeight: '52px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            background: '#fff',
            color: '#555',
            fontSize: '16px',
            cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
            opacity: cart.length === 0 ? 0.4 : 1,
            touchAction: 'manipulation',
          }}
        >
          초기화
        </button>

        {/* 결제 완료 */}
        <button
          onClick={onComplete}
          disabled={isCompleteDisabled}
          style={{
            flex: 2,
            minHeight: '52px',
            border: 'none',
            borderRadius: '8px',
            background: isCompleteDisabled ? '#aaa' : '#2563eb',
            color: '#fff',
            fontSize: '18px',
            fontWeight: '700',
            cursor: isCompleteDisabled ? 'not-allowed' : 'pointer',
            touchAction: 'manipulation',
          }}
        >
          {completing ? '처리 중...' : '결제 완료'}
        </button>
      </div>
    </div>
  )
}
