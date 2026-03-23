// 주문 취소 훅 (소프트 삭제 — status = '취소' UPDATE만 허용, DELETE 금지)
import supabase from '../lib/supabase'

export default function useOrderCancel() {
  // orderId에 해당하는 주문의 status를 '취소'로 변경
  const cancelOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: '취소' })
        .eq('id', orderId)

      if (error) throw new Error('주문 취소에 실패했습니다.')

      return true
    } catch (err) {
      console.error('주문 취소 실패:', err)
      throw err
    }
  }

  return { cancelOrder }
}
