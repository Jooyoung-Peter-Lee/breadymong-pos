// 상품 옵션 정의 파일
// CATEGORY_OPTIONS의 키는 DB products.category 값과 반드시 일치해야 함

// ─── 옵션 그룹 정의 ───────────────────────────────────────────────────────────
export const OPTION_GROUPS = {
  온도: {
    key: '온도',
    label: '핫 / 아이스',
    required: true,
    options: [
      { value: '핫',   label: '핫',   surcharge: 0 },
      { value: '아이스', label: '아이스', surcharge: 0 },
    ],
  },
  원두: {
    key: '원두',
    label: '원두',
    required: true,
    options: [
      { value: '일반',    label: '일반',    surcharge: 0 },
      { value: '디카페인', label: '디카페인', surcharge: 0 },
    ],
  },
  TOGO: {
    key: 'TOGO',
    label: 'TOGO',
    required: true,
    options: [
      { value: '매장', label: '매장', surcharge: 0 },
      { value: 'TOGO', label: 'TOGO', surcharge: 0 },
    ],
  },
  업그레이드: {
    key: '업그레이드',
    label: '업그레이드',
    required: true,
    options: [
      { value: '없음',      label: '없음',      surcharge: 0    },
      { value: '사이즈업',   label: '사이즈업',   surcharge: 500  },
      { value: '밀크티변경', label: '밀크티변경', surcharge: 3000 },
    ],
  },
}

// ─── 카테고리별 옵션 그룹 매핑 ──────────────────────────────────────────────
// 키: DB products.category 값과 일치 (SELECT DISTINCT category FROM products 기준)
// 모든 SET 메뉴에 음료가 포함되어 있으므로 동일한 옵션 적용
export const CATEGORY_OPTIONS = {
  '덮밥/볶음밥 SET': ['온도', '원두', 'TOGO', '업그레이드'],
  '샌드위치 SET':    ['온도', '원두', 'TOGO', '업그레이드'],
  '샐러드 SET':      ['온도', '원두', 'TOGO', '업그레이드'],
  '핫도그 SET':      ['온도', '원두', 'TOGO', '업그레이드'],
}

// ─── 상품 코드별 옵션 재정의 ─────────────────────────────────────────────────
// 카테고리 기본값 대신 상품 단위로 옵션을 별도 지정할 때 사용
export const PRODUCT_OPTIONS = {}

// ─── 유틸 함수 ───────────────────────────────────────────────────────────────

/**
 * 특정 상품의 옵션 그룹 배열 반환
 * 상품 코드 재정의 > 카테고리 기본값 > 빈 배열 순으로 적용
 */
export function getOptionGroupsForProduct(category, productCode) {
  if (productCode && PRODUCT_OPTIONS[productCode]) {
    return PRODUCT_OPTIONS[productCode]
      .map((key) => OPTION_GROUPS[key])
      .filter(Boolean)
  }
  if (category && CATEGORY_OPTIONS[category]) {
    return CATEGORY_OPTIONS[category]
      .map((key) => OPTION_GROUPS[key])
      .filter(Boolean)
  }
  return []
}

/**
 * 선택된 옵션 객체를 표시용 레이블 문자열로 변환
 * 예: { 온도: '아이스', 원두: '디카페인', TOGO: 'TOGO', 업그레이드: '사이즈업' }
 *   → '아이스 · 디카페인 · TOGO · 사이즈업'
 * '없음'인 항목은 레이블에서 제외
 */
export function formatOptionsLabel(selectedOptions) {
  if (!selectedOptions || Object.keys(selectedOptions).length === 0) return ''
  return Object.entries(selectedOptions)
    .map(([groupKey, value]) => {
      // '없음'은 표시 생략
      if (value === '없음') return null
      const group = OPTION_GROUPS[groupKey]
      if (!group) return value
      const opt = group.options.find((o) => o.value === value)
      return opt ? opt.label : value
    })
    .filter(Boolean)
    .join(' · ')
}

/**
 * 선택된 옵션의 추가 금액 합산 계산
 * 예: { 업그레이드: '사이즈업' } → 500
 */
export function calcSurcharge(selectedOptions) {
  if (!selectedOptions || Object.keys(selectedOptions).length === 0) return 0
  return Object.entries(selectedOptions).reduce((sum, [groupKey, value]) => {
    const group = OPTION_GROUPS[groupKey]
    if (!group) return sum
    const opt = group.options.find((o) => o.value === value)
    return sum + (opt ? opt.surcharge : 0)
  }, 0)
}
