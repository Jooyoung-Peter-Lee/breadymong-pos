# CLAUDE.md

Claude Code가 이 프로젝트를 작업할 때 반드시 따라야 할 규칙과 컨텍스트 문서.

---

## 프로젝트 한 줄 요약

브레디몽 매장 전용 주문 관리 웹앱.
페이코 오프라인 결제 시 제품 정보가 기록되지 않는 문제를 해결하기 위해,
직원이 태블릿에서 제품을 선택 → 합계 금액을 페이코 단말에 수동 입력 → 결제 완료 처리하는 흐름.

자세한 아키텍처는 `ARCHITECTURE.md` 참고.

---

## 코드 작성 규칙

### 공통
- 언어: JavaScript (TypeScript 사용 안 함)
- 컴포넌트: 함수형 + React Hooks만 사용
- 스타일: CSS Module 또는 인라인 스타일 (외부 UI 라이브러리 추가 금지)
- 주석: 한국어로 작성
- 콘솔 로그: 개발 중에는 허용, 배포 전 제거

### 네이밍
- 컴포넌트 파일: PascalCase (`ProductCard.jsx`)
- 훅 파일: camelCase + use 접두사 (`useProducts.js`)
- 유틸 함수: camelCase
- Supabase 테이블명: snake_case (`order_items`)
- 상수: UPPER_SNAKE_CASE

### 훅 파일 역할 분리 기준

`src/hooks/` 파일은 아래 기준으로 분리한다:

| 파일 | 역할 | 주요 반환값 |
|---|---|---|
| `useProducts.js` | 제품 목록 조회 (SELECT) | `products`, `loading`, `error` |
| `useOrders.js` | 주문 목록 조회 (SELECT) | `orders`, `loading`, `error` |
| `useOrderActions.js` | 주문 생성 / 수정 (INSERT · UPDATE) | `createOrder`, `updateOrder` |
| `useOrderCancel.js` | 주문 취소 (status UPDATE) | `cancelOrder` |

- 기능별로 파일을 분리해 각 훅의 책임 범위를 최소화
- `useOrders.js`에 mutation 로직 추가 금지
- `useOrderActions.js`에 취소 로직 추가 금지 → 반드시 `useOrderCancel.js`에 작성
- 각 mutation 함수는 `async` 함수로 작성, 성공/실패 여부를 `return`으로 반환

### 파일 수정 원칙
- 기존 파일 수정 시 전체를 재작성하지 말고 변경 부분만 수정
- 새 기능은 반드시 새 컴포넌트 / 훅 파일로 분리

---

## Supabase 사용 규칙

- 클라이언트는 `src/lib/supabase.js` 단일 파일에서만 초기화
- 모든 DB 접근은 `src/hooks/` 안의 커스텀 훅을 통해서만 처리
- 페이지 컴포넌트에서 직접 supabase 호출 금지
- 에러 처리: 모든 Supabase 호출에 try/catch 적용, 에러는 한국어 메시지로 사용자에게 표시
- 환경변수: `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 사용

```js
// 올바른 예시
const { data, error } = await supabase.from('orders').select('*')
if (error) throw new Error('주문 목록을 불러오지 못했습니다.')

// 금지 - 페이지에서 직접 호출
// pages/OrderPage.jsx 안에서 supabase.from(...) 직접 호출 금지
```

---

## 데이터 처리 규칙

- 금액: 항상 **원 단위 정수** (소수점 없음)
- 금액 표시: `toLocaleString('ko-KR')` 사용 → `12,000원`
- 날짜: `date-fns` 사용, 포맷은 `yyyy-MM-dd` 기준
- 주문 취소: 실제 삭제(DELETE) 금지 → `status = '취소'` 소프트 삭제
- 제품명/단가: 주문 시점에 `order_items`에 스냅샷 저장 (나중에 제품 수정해도 과거 기록 유지)

### 주문 수정 범위 (Phase 2)

- **수정 가능**: `order_items` 수량 변경 / 제품 종류 변경 (아이템 추가 · 삭제 포함)
- **수정 불가**: 주문 건 자체 삭제 (취소는 소프트 삭제만 허용)
- **수정 목적**: 기록 정정 목적 — 페이코 단말 결제 금액과 DB 금액이 달라져도 별도 재결제 없이 DB만 수정
- **`total_amount` 재계산**: 수정 후 반드시 `order_items` 합산으로 `orders.total_amount` 업데이트
- **아이템 삭제 방식**: `order_items` 행 DELETE (RLS 정책에서 `order_items` DELETE 허용 필요 — ARCHITECTURE.md 보안 정책 참고)

---

## UI / UX 규칙

- 타겟 디바이스: 매장 태블릿 (터치 조작 기준)
- 버튼 최소 크기: 터치 영역 48px 이상
- 합계 금액: 화면에서 가장 크게 표시 (페이코 단말 입력 시 한눈에 보여야 함)
- 로딩 상태: 데이터 fetch 중 스피너 또는 "불러오는 중..." 표시
- 에러 상태: 빨간 텍스트로 한국어 에러 메시지 표시
- 결제 완료 후: 장바구니 자동 초기화

### App.jsx 레이아웃 명세

- 네비게이션: **상단 고정 탭 메뉴** (하단 탭바 사용 안 함)
- 탭 순서: `주문 입력` → `주문 내역` → `매출 통계`
- 현재 활성 탭은 시각적으로 강조 (NavLink `isActive` 활용)
- 탭 메뉴는 모든 페이지에서 항상 노출, 숨김 처리 없음
- 탭 아래 `<main>` 영역에 `<Routes>` 배치

```
┌─────────────────────────────────────┐
│  [주문 입력]  주문 내역  매출 통계   │  ← 상단 고정 탭
├─────────────────────────────────────┤
│                                     │
│         페이지 콘텐츠 영역           │
│         (<main> / <Routes>)         │
│                                     │
└─────────────────────────────────────┘
```

---

## 금지 사항

- `localStorage` / `sessionStorage` 사용 금지 (Supabase에 저장)
- `any` 타입 사용 금지 (TS 미사용이므로 해당 없음)
- 페이지 컴포넌트에서 직접 Supabase 호출 금지
- 하드코딩된 제품 목록 금지 (반드시 Supabase `products` 테이블에서 fetch)
- 외부 UI 라이브러리 추가 금지 (recharts, xlsx, date-fns 외)

---

## 자주 쓰는 명령어

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview

# Netlify 배포
netlify deploy --prod
```

---

## 작업 시작 전 체크리스트

새 기능 작업 전 반드시 확인:
1. `ARCHITECTURE.md`에서 해당 Phase 확인
2. 관련 훅(`useProducts`, `useOrders`) 먼저 작성 또는 확인
3. Supabase 테이블 스키마와 컬럼명 일치 여부 확인
4. `.env.local`에 환경변수 설정 여부 확인

---

## 현재 개발 상태

| Phase | 파일 | 상태 |
|---|---|---|
| Phase 1 | `src/lib/supabase.js` | ✅ 완료 |
| Phase 1 | `src/hooks/useProducts.js` | ✅ 완료 |
| Phase 1 | `src/hooks/useOrders.js` | ✅ 완료 |
| Phase 1 | `src/hooks/useOrderActions.js` | ✅ 완료 |
| Phase 1 | `src/hooks/useOrderCancel.js` | ✅ 완료 |
| Phase 1 | `src/pages/OrderPage.jsx` | ✅ 완료 |
| Phase 1 | `src/components/ProductCard.jsx` | ✅ 완료 |
| Phase 1 | `src/components/CartSummary.jsx` | ✅ 완료 |
| Phase 1 | `src/App.jsx` | ✅ 완료 |
| Phase 2 | `src/pages/HistoryPage.jsx` | ✅ 완료 |
| Phase 2 | `src/components/OrderList.jsx` | ✅ 완료 |
| Phase 3 | `src/hooks/useOrdersByDateRange.js` | ✅ 완료 |
| Phase 3 | `src/pages/StatsPage.jsx` | ✅ 완료 |
| Phase 3 | `src/components/SalesChart.jsx` | ✅ 완료 |


---

## 옵션 기능 (2026.03 추가)

### 신규 파일
- `src/constants/productOptions.js` — 옵션 그룹 정의 및 헬퍼 함수
- `src/components/OptionModal.jsx` + `OptionModal.css` — 옵션 선택 모달
- `src/hooks/useReceipt.js` — 영수증 프린트 훅
- `src/styles/receipt-print.css` — 영수증 인쇄 전용 CSS

### 옵션 동작 방식
- 상품 클릭 시 `getOptionGroupsForProduct(category, code)` 호출
- 옵션 그룹이 있으면 `OptionModal` 표시, 없으면 바로 담기
- 옵션 조합이 다르면 장바구니에 **별개 항목**으로 추가 (`optionsKey`로 구분)
- 추가금(`surcharge`)은 `item.price`와 별도로 저장, 합산해서 표시

### 카테고리별 옵션 규칙 (`productOptions.js` 참고)
| 카테고리 | 적용 옵션 |
|---------|---------|
| 커피 | 온도(필수), 포장(필수), 샷변경, 디카페인 |
| 논커피 | 온도(필수), 포장(필수) |
| 에이드/스무디 | 포장(필수) |
| 베이커리/케이크 | 포장(필수) |

### 추가금 기본값
| 옵션 | 금액 |
|-----|-----|
| 아이스 | +500원 |
| 샷 추가 | +500원 |
| 디카페인 | +500원 |
| 나머지 | 0원 |

> 금액 변경 시 `productOptions.js`의 `surcharge` 값만 수정

### order_items 테이블 추가 컬럼
```sql
options   JSONB    DEFAULT '{}'   -- 선택된 옵션 원본 객체
surcharge INTEGER  DEFAULT 0      -- 옵션 추가금 (unit_price 미포함)
```

### useOrderActions.js addItem 시그니처
```js
addItem(product, selectedOptions = {}, surcharge = 0)
// 옵션 없는 상품: addItem(product, {}, 0)
```

---

## 영수증 프린트 기능 (2026.03 추가)

### 프린터 환경
- 기종: 토스 CPP-3000 (80mm 열전사, 인쇄너비 72mm, 자동 커팅)
- 연결: USB 또는 유선랜
- 출력 방식: `window.print()` + `@media print` CSS

### 트리거
- 결제 완료 버튼 클릭 시 자동 출력

### 영수증 항목
- 주문 일시
- 제품명 + 옵션 (`└ 아이스 · To Go` 형태)
- 수량
- 구분선 (점선)
- 합계

### printReceipt 호출 방법
```js
const { printReceipt } = useReceipt({ storeName: '브레디몽' });

printReceipt({
  id:          order.id,           // UUID (끝 4자리가 주문번호로 표시)
  created_at:  order.created_at,   // ISO string
  totalAmount: order.total_amount,
  paymentType: '카드',              // 생략 가능
  items: cart.map(item => ({
    name:         item.name,
    optionsLabel: item.optionsLabel ?? '',
    surcharge:    item.surcharge    ?? 0,
    quantity:     item.quantity,
    price:        item.price,
  })),
});
```

### 브라우저 인쇄 설정 (최초 1회 세팅 필요)
- Chrome → 용지: `80 × 200mm` 커스텀 등록
- 여백: 없음
- 기본 프린터: CPP-3000

### CSS 구조
- `#receipt-print-root`: 화면에서 `display:none`, 인쇄 시에만 표시
- `body > *:not(#receipt-print-root)`: 인쇄 시 전부 숨김
- `@page { size: 80mm auto; margin: 0; }`
