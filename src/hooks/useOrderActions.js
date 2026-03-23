// 주문 생성 / 수정 훅
import supabase from '../lib/supabase'

export default function useOrderActions() {
  // 주문 생성: RPC로 트랜잭션 처리 (orders + order_items 원자적 INSERT)
  // cartItems: [{ product_id, product_code, product_name, product_category, unit_price, quantity }]
  const createOrder = async (cartItems) => {
    try {
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
      )

      const { error } = await supabase.rpc('create_order_with_items', {
        p_total_amount: totalAmount,
        p_items: cartItems.map((item) => ({
          product_id:       item.product_id,
          product_code:     item.product_code,
          product_name:     item.product_name,
          product_category: item.product_category,
          unit_price:       item.unit_price,
          quantity:         item.quantity,
        })),
      })

      if (error) throw new Error('주문 생성에 실패했습니다.')

      return true
    } catch (err) {
      console.error('주문 생성 실패:', err)
      throw err
    }
  }

  // 주문 수정: 기존 order_items 전체 삭제 후 updatedItems로 재삽입, total_amount 재계산
  // updatedItems: [{ product_id, product_name, product_category, unit_price, quantity }]
  const updateOrder = async (orderId, updatedItems) => {
    try {
      // 기존 order_items 전체 삭제
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId)

      if (deleteError) throw new Error('기존 주문 상품 삭제에 실패했습니다.')

      // 새 order_items INSERT
      const orderItems = updatedItems.map((item) => ({
        order_id:         orderId,
        product_id:       item.product_id,
        product_name:     item.product_name,
        product_category: item.product_category,
        unit_price:       item.unit_price,
        quantity:         item.quantity,
      }))

      const { error: insertError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (insertError) throw new Error('수정된 주문 상품 저장에 실패했습니다.')

      // total_amount 재계산 후 orders 업데이트
      const totalAmount = updatedItems.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
      )

      const { error: updateError } = await supabase
        .from('orders')
        .update({ total_amount: totalAmount })
        .eq('id', orderId)

      if (updateError) throw new Error('주문 금액 업데이트에 실패했습니다.')

      return true
    } catch (err) {
      console.error('주문 수정 실패:', err)
      throw err
    }
  }

  return { createOrder, updateOrder }
}
