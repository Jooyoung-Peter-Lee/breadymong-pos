// 제품 목록 조회 훅
import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

export default function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('category')
          .order('name')

        if (error) throw new Error('제품 목록을 불러오지 못했습니다.')

        setProducts(data ?? [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return { products, loading, error }
}
