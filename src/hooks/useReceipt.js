// 영수증 인쇄 훅
// window.print() 방식 — 별도 라이브러리 없음
// receipt-print.css에서 @media print 시 #root 숨기고 #receipt-print만 표시
import { useCallback } from 'react'
import { format } from 'date-fns'

export function useReceipt({ storeName = '브레디몽' } = {}) {
  const printReceipt = useCallback(({ id, created_at, totalAmount, items }) => {
    // #receipt-print 요소가 없으면 body에 동적 생성
    let el = document.getElementById('receipt-print')
    if (!el) {
      el = document.createElement('div')
      el.id = 'receipt-print'
      document.body.appendChild(el)
    }

    const dateStr  = format(new Date(created_at), 'yyyy-MM-dd HH:mm')
    // UUID 뒤 8자리를 주문번호로 표시 (예: #A1B2C3D4)
    const orderNo  = id ? id.slice(-8).toUpperCase() : ''

    // 아이템 HTML 생성
    const itemsHtml = items
      .map((item) => {
        const effectivePrice = (item.price + (item.surcharge ?? 0)) * item.quantity
        const optionsHtml = item.optionsLabel
          ? `<div class="receipt-options">└ ${item.optionsLabel}</div>`
          : ''
        return `
          <div class="receipt-item">
            <div class="receipt-item-row">
              <span>${item.name} × ${item.quantity}</span>
              <span>${effectivePrice.toLocaleString('ko-KR')}원</span>
            </div>
            ${optionsHtml}
          </div>
        `
      })
      .join('')

    // 영수증 HTML 주입
    el.innerHTML = `
      <div class="receipt-store">${storeName}</div>
      <div class="receipt-date">${dateStr}</div>
      <div class="receipt-date">주문번호: #${orderNo}</div>
      <hr class="receipt-divider" />
      ${itemsHtml}
      <hr class="receipt-divider" />
      <div class="receipt-total">
        <span>합계</span>
        <span>${totalAmount.toLocaleString('ko-KR')}원</span>
      </div>
    `

    window.print()

    // 인쇄 다이얼로그 닫힌 후 초기화
    setTimeout(() => {
      el.innerHTML = ''
    }, 500)
  }, [storeName])

  return { printReceipt }
}
