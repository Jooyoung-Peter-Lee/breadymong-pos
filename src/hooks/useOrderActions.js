// 주문 생성 / 수정 + 장바구니 상태 관리 훅
import { useState } from 'react'
import supabase from '../lib/supabase'
import { formatOptionsLabel, calcSurcharge } from '../constants/productOptions'

export default function useOrderActions() {
  // 장바구니 상태
  // 항목: { product_id, product_code, product_name, product_category, unit_price, quantity,
  //          options, optionsKey, optionsLabel, surcharge }
  const [cart, setCart] = useState([])

  // 장바구니에 상품 추가
  // 같은 product_id + 같은 optionsKey → 수량 +1
  // 다른 optionsKey → 별개 항목으로 추가
  const addItem = (product, selectedOptions = {}, surcharge = 0) => {
    const optionsKey   = JSON.stringify(selectedOptions)
    const optionsLabel = formatOptionsLabel(selectedOptions)

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product_id === product.id && item.optionsKey === optionsKey
      )
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id && item.optionsKey === optionsKey
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
          options:          selectedOptions,
          optionsKey,
          optionsLabel,
          surcharge,
        },
      ]
    })
  }

  // 특정 장바구니 아이템의 옵션 업데이트
  // optionsKey: 변경할 항목의 현재 optionsKey
  // newOptions: 새 선택 옵션 객체
  const updateItemOptions = (optionsKey, newOptions) => {
    const newSurcharge  = calcSurcharge(newOptions)
    const newOptionsKey = JSON.stringify(newOptions)
    const newLabel      = formatOptionsLabel(newOptions)

    setCart((prev) =>
      prev.map((item) =>
        item.optionsKey === optionsKey
          ? {
              ...item,
              options:      newOptions,
              optionsKey:   newOptionsKey,
              optionsLabel: newLabel,
              surcharge:    newSurcharge,
            }
          : item
      )
    )
  }

  // 주문 생성: RPC로 트랜잭션 처리 (orders + order_items 원자적 INSERT)
  // 단가 = unit_price + surcharge, 합계 = 단가 × 수량 합산
  const createOrder = async (cartItems) => {
    try {
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + (item.unit_price + (item.surcharge ?? 0)) * item.quantity,
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
          options:          item.options   ?? {},
          surcharge:        item.surcharge ?? 0,
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
        options:          item.options   ?? {},
        surcharge:        item.surcharge ?? 0,
      }))

      const { error: insertError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (insertError) throw new Error('수정된 주문 상품 저장에 실패했습니다.')

      // total_amount 재계산 후 orders 업데이트
      const totalAmount = updatedItems.reduce(
        (sum, item) => sum + (item.unit_price + (item.surcharge ?? 0)) * item.quantity,
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

  return { cart, setCart, addItem, updateItemOptions, createOrder, updateOrder }
}
