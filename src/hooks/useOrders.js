// 주문 목록 조회 훅 (SELECT 전용 — mutation 로직 추가 금지)
import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

export default function useOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // 한국 시간(KST) 기준 당일 범위를 UTC ISO 문자열로 변환해서 Supabase에 전달
        // KST 00:00:00 = UTC 전날 15:00:00 / KST 23:59:59 = UTC 당일 14:59:59
        const now  = new Date()
        const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(),  0,  0,  0).toISOString()
        const to   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

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
          .gte('created_at', from)
          .lte('created_at', to)
          .order('created_at', { ascending: false })

        if (error) throw new Error('주문 목록을 불러오지 못했습니다.')

        setOrders(data ?? [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  return { orders, loading, error }
}
