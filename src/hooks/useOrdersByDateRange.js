// 날짜 범위 기반 주문 목록 조회 훅 (SELECT 전용 — StatsPage 전용)
// useOrders는 당일 고정이므로 별도 훅으로 분리
import { useState } from 'react'
import supabase from '../lib/supabase'

export default function useOrdersByDateRange() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 조회 버튼 클릭 시 호출 — startDate / endDate: 'yyyy-MM-dd' 문자열
  const fetchOrders = async (startDate, endDate) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_code,
            product_name,
            product_category,
            unit_price,
            quantity
          )
        `)
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: true })

      if (error) throw new Error('매출 데이터를 불러오지 못했습니다.')

      setOrders(data ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { orders, loading, error, fetchOrders }
}
