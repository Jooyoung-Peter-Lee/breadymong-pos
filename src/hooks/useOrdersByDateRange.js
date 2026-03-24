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
      // 'yyyy-MM-dd' 문자열을 로컬(KST) 기준 Date로 변환 후 ISO 문자열로 전달
      // (타임존 없는 문자열을 그대로 쓰면 Supabase가 UTC로 해석해 당일 조회 누락 발생)
      const [sy, sm, sd] = startDate.split('-').map(Number)
      const [ey, em, ed] = endDate.split('-').map(Number)
      const from = new Date(sy, sm - 1, sd,  0,  0,  0).toISOString()
      const to   = new Date(ey, em - 1, ed, 23, 59, 59).toISOString()

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
            quantity,
            options,
            surcharge
          )
        `)
        .gte('created_at', from)
        .lte('created_at', to)
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
