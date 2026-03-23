// [Phase 2] 주문 내역 / 취소 / 수정 페이지
import { useState, useEffect } from 'react'
import useOrders from '../hooks/useOrders'
import useOrderCancel from '../hooks/useOrderCancel'
import useOrderActions from '../hooks/useOrderActions'
import useProducts from '../hooks/useProducts'
import OrderList from '../components/OrderList'

// 수정 모달 — 마운트 시에만 useProducts fetch (lazy loading)
function EditModal({ editCart, editTotal, saving, actionError, onQuantityChange, onRemove, onAddProduct, onClose, onSave }) {
  const { products } = useProducts()

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxHeight: '90vh',
          background: '#fff',
          borderRadius: '16px 16px 0 0',
          padding: '24px 20px',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px' }}>
          주문 수정
        </h2>
        <p style={{ fontSize: '12px', color: '#888', margin: '0 0 16px' }}>
          기록 정정 목적 — 페이코 단말 결제 금액과 달라도 됩니다
        </p>

        {/* 현재 아이템 목록 */}
        {editCart.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '16px 0' }}>
            아이템을 추가해주세요
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: '0 0 12px', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {editCart.map((item) => (
              <li
                key={item.product_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  border: '1px solid #eee',
                  borderRadius: '6px',
                }}
              >
                <span style={{ flex: 1, fontSize: '14px', fontWeight: '500' }}>
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
                      minWidth: '48px', minHeight: '48px',
                      border: '1px solid #ddd', borderRadius: '6px',
                      background: '#fff',
                      color: item.quantity === 1 ? '#e53e3e' : '#333',
                      fontSize: '18px', cursor: 'pointer', touchAction: 'manipulation',
                    }}
                    aria-label={`${item.product_name} 수량 줄이기`}
                  >
                    {item.quantity === 1 ? '×' : '−'}
                  </button>
                  <span style={{ minWidth: '32px', textAlign: 'center', fontSize: '15px', fontWeight: '600' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onQuantityChange(item.product_id, +1)}
                    style={{
                      minWidth: '48px', minHeight: '48px',
                      border: '1px solid #ddd', borderRadius: '6px',
                      background: '#fff', color: '#333',
                      fontSize: '18px', cursor: 'pointer', touchAction: 'manipulation',
                    }}
                    aria-label={`${item.product_name} 수량 늘리기`}
                  >
                    +
                  </button>
                </div>
                <span style={{ minWidth: '80px', textAlign: 'right', fontSize: '14px', color: '#333' }}>
                  {(item.unit_price * item.quantity).toLocaleString('ko-KR')}원
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* 수정 합계 */}
        <div style={{ textAlign: 'center', padding: '12px', background: '#f0f4ff', borderRadius: '8px', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 2px', fontSize: '13px', color: '#555' }}>합계</p>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#1a1a1a' }}>
            {editTotal.toLocaleString('ko-KR')}원
          </p>
        </div>

        {/* 제품 추가 */}
        <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#888', margin: '0 0 10px', textTransform: 'uppercase' }}>
          제품 추가
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => onAddProduct(product)}
              style={{
                minWidth: '100px', minHeight: '56px',
                padding: '8px 12px',
                border: '1px solid #ddd', borderRadius: '8px',
                background: '#fff', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                touchAction: 'manipulation',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{product.name}</span>
              <span style={{ fontSize: '12px', color: '#888' }}>{product.price.toLocaleString('ko-KR')}원</span>
            </button>
          ))}
        </div>

        {/* 저장 에러 */}
        {actionError && (
          <p style={{ color: '#e53e3e', marginBottom: '12px' }}>{actionError}</p>
        )}

        {/* 하단 버튼 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, minHeight: '52px',
              border: '1px solid #ccc', borderRadius: '8px',
              background: '#fff', color: '#555', fontSize: '16px',
              cursor: 'pointer', touchAction: 'manipulation',
            }}
          >
            취소
          </button>
          <button
            onClick={onSave}
            disabled={editCart.length === 0 || saving}
            style={{
              flex: 2, minHeight: '52px',
              border: 'none', borderRadius: '8px',
              background: editCart.length === 0 || saving ? '#aaa' : '#2563eb',
              color: '#fff', fontSize: '18px', fontWeight: '700',
              cursor: editCart.length === 0 || saving ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation',
            }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HistoryPage() {
  // fetchedOrders를 로컬 state로 복사해 취소/수정 후 즉시 반영
  const { orders: fetchedOrders, loading, error } = useOrders()
  const [localOrders, setLocalOrders] = useState([])

  // 수정 모달 state
  const [editingOrder, setEditingOrder] = useState(null)
  const [editCart, setEditCart] = useState([])
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState(null)

  const { cancelOrder } = useOrderCancel()
  const { updateOrder } = useOrderActions()

  // fetchedOrders 로드 완료 시 로컬 state로 복사
  useEffect(() => {
    setLocalOrders(fetchedOrders)
  }, [fetchedOrders])

  // ── 취소 처리 ──────────────────────────────────────────────
  const handleCancel = async (orderId) => {
    setActionError(null)
    try {
      await cancelOrder(orderId)
      // DB 재조회 없이 로컬 state에서 즉시 반영
      setLocalOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: '취소' } : o))
      )
    } catch (err) {
      setActionError(err.message)
    }
  }

  // ── 수정 모달 ───────────────────────────────────────────────
  const handleEditOpen = (order) => {
    setEditingOrder(order)
    // order_items를 editCart 형식으로 변환
    setEditCart(
      order.order_items.map((item) => ({
        product_id:       item.product_id,
        product_name:     item.product_name,
        product_category: item.product_category,
        unit_price:       item.unit_price,
        quantity:         item.quantity,
      }))
    )
    setActionError(null)
  }

  const handleEditClose = () => {
    setEditingOrder(null)
    setEditCart([])
    setActionError(null)
  }

  // 수정 모달 내 수량 조절
  const handleEditQuantityChange = (productId, delta) => {
    setEditCart((prev) =>
      prev
        .map((item) =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  // 수정 모달 내 아이템 제거
  const handleEditRemove = (productId) => {
    setEditCart((prev) => prev.filter((item) => item.product_id !== productId))
  }

  // 수정 모달 내 제품 추가 (이미 있으면 수량 +1)
  const handleEditAddProduct = (product) => {
    setEditCart((prev) => {
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
          product_name:     product.name,
          product_category: product.category,
          unit_price:       product.price,
          quantity:         1,
        },
      ]
    })
  }

  // 수정 저장
  const handleEditSave = async () => {
    if (editCart.length === 0) return
    setSaving(true)
    setActionError(null)
    try {
      await updateOrder(editingOrder.id, editCart)

      // total_amount 재계산 후 로컬 state 즉시 반영
      const newTotal = editCart.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
      )
      setLocalOrders((prev) =>
        prev.map((o) =>
          o.id === editingOrder.id
            ? {
                ...o,
                total_amount: newTotal,
                // index 기반 임시 id 사용 (페이지 새로고침 시 DB에서 실제 id로 교체됨)
                order_items: editCart.map((item, idx) => ({
                  ...item,
                  id: `temp-${idx}`,
                })),
              }
            : o
        )
      )
      handleEditClose()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const editTotal = editCart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  )

  return (
    <div style={{ padding: '20px', maxWidth: '720px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px' }}>
        오늘의 주문 내역
      </h1>

      {/* 취소/수정 액션 에러 */}
      {actionError && !editingOrder && (
        <p style={{ color: '#e53e3e', marginBottom: '12px' }}>{actionError}</p>
      )}

      {loading && <p style={{ color: '#555' }}>불러오는 중...</p>}
      {error && <p style={{ color: '#e53e3e' }}>{error}</p>}
      {!loading && !error && (
        <OrderList
          orders={localOrders}
          onCancel={handleCancel}
          onEdit={handleEditOpen}
        />
      )}

      {/* 수정 모달 — editingOrder가 있을 때만 마운트 → useProducts lazy loading */}
      {editingOrder && (
        <EditModal
          editCart={editCart}
          editTotal={editTotal}
          saving={saving}
          actionError={actionError}
          onQuantityChange={handleEditQuantityChange}
          onRemove={handleEditRemove}
          onAddProduct={handleEditAddProduct}
          onClose={handleEditClose}
          onSave={handleEditSave}
        />
      )}
    </div>
  )
}
