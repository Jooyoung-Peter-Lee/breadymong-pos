// [Phase 1] 주문 입력 페이지
import { useState } from 'react'
import useProducts from '../hooks/useProducts'
import useOrderActions from '../hooks/useOrderActions'
import ProductCard from '../components/ProductCard'
import CartSummary from '../components/CartSummary'
import OptionModal from '../components/OptionModal'
import { getOptionGroupsForProduct } from '../constants/productOptions'
import { useReceipt } from '../hooks/useReceipt'

export default function OrderPage() {
  const [completing, setCompleting] = useState(false)
  const [completeError, setCompleteError] = useState(null)
  // 옵션 모달 대상 상품: null이면 모달 닫힘
  const [optionTarget, setOptionTarget] = useState(null)

  const { products, loading, error } = useProducts()
  const { cart, setCart, addItem, createOrder } = useOrderActions()
  const { printReceipt } = useReceipt({ storeName: '브레디몽' })

  // 제품 카드 탭 → 옵션 그룹이 있으면 모달, 없으면 바로 담기
  const handleProductClick = (product) => {
    const optionGroups = getOptionGroupsForProduct(product.category, product.code)
    if (optionGroups.length > 0) {
      setOptionTarget({ product, optionGroups })
    } else {
      addItem(product, {}, 0)
    }
  }

  // 모달 확인: 선택된 옵션으로 담기
  const handleModalConfirm = (selectedOptions, surcharge) => {
    addItem(optionTarget.product, selectedOptions, surcharge)
    setOptionTarget(null)
  }

  // 장바구니에서 특정 아이템 제거 (product_id + optionsKey 조합으로 식별)
  const handleRemove = (productId, optionsKey) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.product_id === productId && item.optionsKey === optionsKey)
      )
    )
  }

  // 수량 조절: 수량이 0 이하가 되면 아이템 제거
  const handleQuantityChange = (productId, optionsKey, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product_id === productId && item.optionsKey === optionsKey
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
      const savedOrder = await createOrder(cart)
      // 주문 저장 완료 후 영수증 인쇄 (실패해도 결제 완료 처리)
      try {
        printReceipt({
          id:          savedOrder.id,
          created_at:  savedOrder.created_at,
          totalAmount: savedOrder.total_amount,
          items: cart.map((item) => ({
            name:         item.product_name,
            optionsLabel: item.optionsLabel ?? '',
            surcharge:    item.surcharge    ?? 0,
            quantity:     item.quantity,
            price:        item.unit_price,
          })),
        })
      } catch {
        // 프린터 없거나 인쇄 실패 시 무시하고 결제 완료 처리
      }
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
        flexWrap: 'wrap',
      }}
    >
      {/* 좌측: 제품 목록 */}
      <div style={{ flex: '1 1 400px' }}>
        {loading && <p style={{ color: '#555' }}>불러오는 중...</p>}
        {error && <p style={{ color: '#e53e3e' }}>{error}</p>}
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
                      onAdd={handleProductClick}
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

      {/* 옵션 선택 모달 */}
      {optionTarget && (
        <OptionModal
          product={optionTarget.product}
          optionGroups={optionTarget.optionGroups}
          onConfirm={handleModalConfirm}
          onCancel={() => setOptionTarget(null)}
        />
      )}
    </div>
  )
}
