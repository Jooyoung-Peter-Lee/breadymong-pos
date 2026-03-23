// 제품 선택 버튼 카드 컴포넌트
export default function ProductCard({ product, onAdd }) {
  return (
    <button
      onClick={() => onAdd(product)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '120px',
        minHeight: '80px',
        padding: '12px 16px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        background: '#fff',
        cursor: 'pointer',
        gap: '6px',
        // 터치 영역 최소 48px 보장
        touchAction: 'manipulation',
      }}
    >
      <span style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>
        {product.name}
      </span>
      <span style={{ fontSize: '13px', color: '#666' }}>
        {product.price.toLocaleString('ko-KR')}원
      </span>
    </button>
  )
}
