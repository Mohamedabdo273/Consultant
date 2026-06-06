import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header  from './Header';
import { useLang } from '../../context/LangContext';

export default function AppLayout() {
  const { isRTL }             = useLang();
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(p => !p)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Header
        onMenuClick={() => setMobileOpen(true)}
        collapsed={collapsed}
      />
      <main
        className="pt-16 min-h-screen transition-all duration-300"
        style={{ paddingInlineStart: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (collapsed ? '4rem' : '260px') : 0 }}
      >
        <div className="p-4 sm:p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
