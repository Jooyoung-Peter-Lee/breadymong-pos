# 브레디몽 POS 시스템 아키텍처

## 프로젝트 개요

페이코 오프라인 결제 시 제품 정보가 기록되지 않는 문제를 해결하기 위한
매장 전용 주문 관리 웹앱.

직원이 태블릿/PC에서 제품을 선택하면 금액이 자동 계산되고,
해당 금액을 페이코 단말에 수동 입력 후 결제 완료 처리.
모든 주문 데이터는 Supabase에 저장되어 매출 통계 및 정산에 활용.

---

## 기술 스택

| 구분 | 기술 | 버전 |
|---|---|---|
| 프론트엔드 | React + Vite | React 18 |
| 라우팅 | React Router DOM | v6 |
| DB / BaaS | Supabase | - |
| 차트 | Recharts | - |
| 엑셀 출력 | SheetJS (xlsx) | - |
| 날짜 처리 | date-fns | - |
| 배포 | Netlify | - |

---

## 폴더 구조

```
bredymong-pos/
├── public/
├── src/
│   ├── lib/
│   │   └── supabase.js          # Supabase 클라이언트 초기화
│   │
│   ├── hooks/
│   │   ├── useProducts.js       # 제품 목록 조회
│   │   ├── useOrders.js         # 주문 목록 조회
│   │   ├── useOrderActions.js   # 주문 생성 / 수정
│   │   └── useOrderCancel.js    # 주문 취소
│   │
│   ├── pages/
│   │   ├── OrderPage.jsx        # [Phase 1] 주문 입력
│   │   ├── HistoryPage.jsx      # [Phase 2] 주문 내역 / 취소 / 수정
│   │   └── StatsPage.jsx        # [Phase 3] 매출 통계 + 엑셀 다운로드
│   │
│   ├── components/
│   │   ├── ProductCard.jsx      # 제품 선택 버튼 카드
│   │   ├── CartSummary.jsx      # 장바구니 및 합계 금액 표시
│   │   ├── OrderList.jsx        # 주문 목록 테이블
│   │   └── SalesChart.jsx       # 일별 / 제품별 매출 차트
│   │
│   ├── App.jsx                  # 라우터 및 레이아웃 설정
│   └── main.jsx
│
├── .env.local                   # Supabase 환경변수 (gitignore)
├── .gitignore
├── index.html
├── vite.config.js
├── ARCHITECTURE.md
└── CLAUDE.md
```

---

## Supabase 데이터베이스 스키마

```sql
-- 제품 테이블
create table products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  price        integer not null,         -- 원 단위 정수
  category     text,
  is_active    boolean default true,     -- false = 판매 중지
  created_at   timestamptz default now()
);

-- 주문 테이블
create table orders (
  id           uuid primary key default gen_random_uuid(),
  total_amount integer not null,
  status       text default '완료',      -- '완료' | '취소'
  created_at   timestamptz default now()
);

-- 주문 상품 테이블
create table order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid references orders(id) on delete cascade,
  product_id       uuid references products(id),
  product_name     text not null,            -- 제품명 스냅샷 (제품 수정 후에도 기록 유지)
  product_category text,                     -- 카테고리 스냅샷 (StatsPage 카테고리별 매출 집계용)
  quantity         integer not null,
  unit_price       integer not null          -- 결제 시점 단가 스냅샷
);
```

---

## 화면 구성 및 라우팅

| 경로 | 페이지 | 설명 |
|---|---|---|
| `/` | OrderPage | 제품 선택 → 합계 표시 → 결제 완료 처리 |
| `/history` | HistoryPage | 당일 주문 목록 / 취소 / 수정 |
| `/stats` | StatsPage | 날짜 범위 매출 통계 / 엑셀 다운로드 |

### App.jsx 구조

- 전체 레이아웃: 상단 고정 탭 네비게이션 + 하단 페이지 콘텐츠 영역
- 탭 순서: 주문 입력(`/`) → 주문 내역(`/history`) → 매출 통계(`/stats`)
- 현재 활성 탭은 시각적으로 강조 표시 (`NavLink`의 `isActive` 활용)
- 네비게이션 바는 모든 페이지에서 항상 노출 (숨김 없음)

```jsx
// App.jsx 구조 예시
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import OrderPage from './pages/OrderPage'
import HistoryPage from './pages/HistoryPage'
import StatsPage from './pages/StatsPage'

export default function App() {
  return (
    <BrowserRouter>
      {/* 상단 탭 네비게이션 - 항상 고정 노출 */}
      <nav>
        <NavLink to="/">주문 입력</NavLink>
        <NavLink to="/history">주문 내역</NavLink>
        <NavLink to="/stats">매출 통계</NavLink>
      </nav>

      {/* 페이지 콘텐츠 영역 */}
      <main>
        <Routes>
          <Route path="/" element={<OrderPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
```

---

## 데이터 흐름

```
[OrderPage]
  직원이 ProductCard 탭
    → 장바구니(로컬 state) 업데이트
    → CartSummary에 합계 금액 표시
    → 직원이 페이코 단말에 금액 수동 입력 후 결제
    → "결제 완료" 버튼 클릭
    → Supabase orders + order_items INSERT
         (product_name / product_category / unit_price 스냅샷 포함)
    → 장바구니 초기화

[HistoryPage]
  오늘 날짜 orders 조회 (order_items JOIN)
    → 취소: status = '취소' UPDATE (소프트 삭제)
    → 수정: order_items UPDATE + total_amount 재계산

[StatsPage]
  날짜 범위 선택
    → orders WHERE created_at BETWEEN 조회
    → 제품별 / 일별 집계
    → Recharts로 시각화
    → SheetJS로 엑셀 다운로드
```

---

## 환경변수

`.env.local` 파일에 아래 두 값 설정 (Supabase 대시보드 → Project Settings → API):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 보안 정책

### RLS (Row Level Security)

이 프로젝트는 **매장 내부 전용 앱**으로, 별도 로그인 없이 anon key로만 동작한다.
따라서 아래 정책을 의도적으로 적용한다:

| 테이블 | RLS | 정책 |
|---|---|---|
| `products` | ✅ 활성화 | anon → SELECT만 허용 (INSERT/UPDATE/DELETE 차단) |
| `orders` | ✅ 활성화 | anon → SELECT / INSERT / UPDATE 허용 (DELETE 차단) |
| `order_items` | ✅ 활성화 | anon → SELECT / INSERT / UPDATE / DELETE 허용 |

> `orders` DELETE를 차단하는 이유: 주문 건 자체는 취소(`status = '취소'`) 소프트 삭제만 허용.
> `order_items` DELETE를 허용하는 이유: 결제 후 주문 수정 시 아이템 삭제가 필요하기 때문.

Supabase 대시보드 → Authentication → Policies에서 테이블별로 아래 SQL을 실행:

```sql
-- products: 읽기 전용
alter table products enable row level security;
create policy "anon read products" on products for select to anon using (true);

-- orders: 조회 / 생성 / 수정 허용
alter table orders enable row level security;
create policy "anon read orders"   on orders for select to anon using (true);
create policy "anon insert orders" on orders for insert to anon with check (true);
create policy "anon update orders" on orders for update to anon using (true);

-- order_items: 조회 / 생성 / 수정 / 삭제 허용
alter table order_items enable row level security;
create policy "anon read order_items"   on order_items for select to anon using (true);
create policy "anon insert order_items" on order_items for insert to anon with check (true);
create policy "anon update order_items" on order_items for update to anon using (true);
create policy "anon delete order_items" on order_items for delete to anon using (true);
```

### anon key 관리 원칙

anon key는 프론트엔드 번들에 포함되어 누구나 열람 가능하다.
**RLS가 유일한 데이터 보호 수단**이므로 아래 원칙을 반드시 준수:

1. **`.env.local`은 절대 Git에 커밋하지 않는다** — `.gitignore`에 포함 필수
2. **`service_role` key는 절대 프론트엔드에 사용하지 않는다** — RLS를 우회하므로 치명적
3. **Netlify 환경변수에만 `VITE_SUPABASE_ANON_KEY` 설정** — 소스코드에 하드코딩 금지
4. **key 유출 시**: Supabase 대시보드 → Project Settings → API → `Reset` 으로 즉시 재발급

> 참고: Supabase는 2025년부터 anon key를 대체하는 `sb_publishable_...` 형식의 신규 키 체계를 도입 중.
> 현재는 기존 anon key 사용이 유효하나, 추후 대시보드에서 신규 키로 마이그레이션 권장.

---

## 개발 단계

| Phase | 내용 | 상태 |
|---|---|---|
| Phase 1 | 주문 입력 화면 (OrderPage) | 🔲 예정 |
| Phase 2 | 주문 내역 / 취소 / 수정 (HistoryPage) | 🔲 예정 |
| Phase 3 | 매출 통계 + 엑셀 다운로드 (StatsPage) | 🔲 예정 |

---

## 배포

```bash
# 빌드
npm run build

# Netlify CLI로 배포
netlify deploy --prod
```

Netlify 환경변수에도 `.env.local`과 동일한 값 설정 필요.
