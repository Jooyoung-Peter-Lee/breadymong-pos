// 옵션 선택 모달 컴포넌트
// props:
//   product: 선택된 상품 객체 { id, name, price, category, code }
//   optionGroups: 표시할 옵션 그룹 배열 [{ key, label, required, options: [{value, label, surcharge}] }]
//   onConfirm(selectedOptions, surcharge): 담기 확인 콜백
//   onCancel(): 취소 / 오버레이 클릭 콜백
import { useState } from 'react'
import { calcSurcharge } from '../constants/productOptions'
import './OptionModal.css'

export default function OptionModal({ product, optionGroups, onConfirm, onCancel }) {
  // 초기값: 각 그룹의 첫 번째 옵션을 기본 선택
  const [selected, setSelected] = useState(() => {
    const init = {}
    optionGroups.forEach((group) => {
      if (group.options.length > 0) {
        init[group.key] = group.options[0].value
      }
    })
    return init
  })

  const handleSelect = (groupKey, value) => {
    setSelected((prev) => ({ ...prev, [groupKey]: value }))
  }

  const handleConfirm = () => {
    const surcharge = calcSurcharge(selected)
    onConfirm(selected, surcharge)
  }

  return (
    <div className="option-modal-overlay" onClick={onCancel}>
      <div className="option-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="option-modal__title">{product.name} 옵션 선택</h2>

        {optionGroups.map((group) => (
          <div key={group.key} className="option-modal__group">
            <p className="option-modal__group-label">
              {group.label}
              {group.required && <span className="option-modal__required"> *</span>}
            </p>
            <div className="option-modal__buttons">
              {group.options.map((opt) => (
                <button
                  key={opt.value}
                  className={`option-modal__btn${selected[group.key] === opt.value ? ' option-modal__btn--active' : ''}`}
                  onClick={() => handleSelect(group.key, opt.value)}
                >
                  {opt.label}
                  {opt.surcharge > 0 && (
                    <span className="option-modal__surcharge">
                      +{opt.surcharge.toLocaleString('ko-KR')}원
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="option-modal__footer">
          <button className="option-modal__cancel" onClick={onCancel}>
            취소
          </button>
          <button className="option-modal__confirm" onClick={handleConfirm}>
            담기
          </button>
        </div>
      </div>
    </div>
  )
}
