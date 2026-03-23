// [Phase 1] 주문 입력 페이지
import { useState } from 'react'
import useProducts from '../hooks/useProducts'
import useOrderActions from '../hooks/useOrderActions'
import ProductCard from '../components/ProductCard'
import CartSummary from '../components/CartSummary'

export default function OrderPage() {
  // 장바구니: [{ product_id, product_name, product_category, unit_price, quantity }]
  const [cart, setCart] = useState([])
  const [completing, setCompleting] = useState(false)
  const [completeError, setCompleteError] = useState(null)

  const { products, loading, error } = useProducts()
  const { createOrder } = useOrderActions()

  // 제품 카드 탭 → 장바구니에 추가 (이미 있으면 수량 +1)
  const handleAdd = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [
        ...prev,
        {
          product_id:       product.id,
          product_code:     product.code,
          product_name:     product.name,
          product_category: product.category,
          unit_price:       product.price,
          quantity:         1,
        },
      ]
    })
  }

  // 장바구니에서 특정 아이템 제거
  const handleRemove = (productId) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId))
  }

  // 수량 조절: delta 양수면 증가, 음수면 감소. 수량이 0 이하가 되면 아이템 제거
  const handleQuantityChange = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  // 장바구니 전체 초기화
  const handleClear = () => {
    setCart([])
  }

  // 결제 완료 처리
  const handleComplete = async () => {
    if (cart.length === 0) return
    setCompleting(true)
    setCompleteError(null)
    try {
      await createOrder(cart)
      setCart([]) // 결제 완료 후 장바구니 자동 초기화
    } catch (err) {
      setCompleteError(err.message)
    } finally {
      setCompleting(false)
    }
  }

  // 카테고리별로 제품 그룹화
  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category || '기타'
    if (!acc[category]) acc[category] = []
    acc[category].push(product)
    return acc
  }, {})

  return (
    <div
      style={{
        display: 'flex',
        gap: '24px',
        padding: '20px',
        alignItems: 'flex-start',
        // 태블릿 세로 레이아웃: 제품 목록(좌) + 장바구니(우)
        flexWrap: 'wrap',
      }}
    >
      {/* 좌측: 제품 목록 */}
      <div style={{ flex: '1 1 400px' }}>
        {loading && (
          <p style={{ color: '#555' }}>불러오는 중...</p>
        )}
        {error && (
          <p style={{ color: '#e53e3e' }}>{error}</p>
        )}
        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {Object.entries(groupedProducts).map(([category, items]) => (
              <section key={category}>
                <h2
                  style={{
                    margin: '0 0 10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {category}
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {items.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={handleAdd}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* 우측: 장바구니 + 합계 */}
      <div
        style={{
          flex: '0 0 320px',
          position: 'sticky',
          top: '20px',
        }}
      >
        {/* 결제 처리 에러 */}
        {completeError && (
          <p style={{ color: '#e53e3e', marginBottom: '8px' }}>{completeError}</p>
        )}
        <CartSummary
          cart={cart}
          onRemove={handleRemove}
          onQuantityChange={handleQuantityChange}
          onComplete={handleComplete}
          onClear={handleClear}
          completing={completing}
        />
      </div>
    </div>
  )
}
