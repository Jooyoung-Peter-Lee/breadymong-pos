// 라우터 및 레이아웃 설정
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import OrderPage from './pages/OrderPage'
import HistoryPage from './pages/HistoryPage'
import StatsPage from './pages/StatsPage'

// 탭 네비게이션 스타일
const NAV_STYLE = {
  display: 'flex',
  position: 'sticky',
  top: 0,
  zIndex: 100,
  background: '#fff',
  borderBottom: '1px solid #e2e8f0',
  padding: '0 20px',
}

const LINK_BASE_STYLE = {
  display: 'flex',
  alignItems: 'center',
  minHeight: '52px',
  padding: '0 20px',
  fontSize: '16px',
  fontWeight: '500',
  color: '#666',
  textDecoration: 'none',
  borderBottom: '2px solid transparent',
  touchAction: 'manipulation',
}

const LINK_ACTIVE_STYLE = {
  ...LINK_BASE_STYLE,
  color: '#2563eb',
  borderBottom: '2px solid #2563eb',
  fontWeight: '700',
}

export default function App() {
  return (
    <BrowserRouter>
      {/* 상단 고정 탭 네비게이션 — 모든 페이지에서 항상 노출 */}
      <nav style={NAV_STYLE}>
        <NavLink
          to="/"
          end
          style={({ isActive }) => (isActive ? LINK_ACTIVE_STYLE : LINK_BASE_STYLE)}
        >
          주문 입력
        </NavLink>
        <NavLink
          to="/history"
          style={({ isActive }) => (isActive ? LINK_ACTIVE_STYLE : LINK_BASE_STYLE)}
        >
          주문 내역
        </NavLink>
        <NavLink
          to="/stats"
          style={({ isActive }) => (isActive ? LINK_ACTIVE_STYLE : LINK_BASE_STYLE)}
        >
          매출 통계
        </NavLink>
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
