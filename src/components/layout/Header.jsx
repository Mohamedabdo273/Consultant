import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, Globe, Sun, Moon } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../api/index';

export default function Header({ onMenuClick, collapsed }) {
  const { lang, toggleLang, t, isRTL } = useLang();
  const { user }                        = useAuth();
  const navigate                        = useNavigate();
  const [searchOpen, setSearchOpen]     = useState(false);
  const [searchVal,  setSearchVal]      = useState('');
  const searchRef                       = useRef(null);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn:  () => notificationsApi.getUnread(),
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.data?.data ?? 0;

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchOpen(false);
      setSearchVal('');
    }
  };

  const marginClass = isRTL
    ? `mr-${collapsed ? '16' : '[260px]'}`
    : `ml-${collapsed ? '16' : '[260px]'}`;

  return (
    <header className={`fixed top-0 ${isRTL ? 'right-0 left-0' : 'left-0 right-0'} h-16 bg-white border-b border-gray-200 z-30
      transition-all duration-300 flex items-center px-4 gap-3
      ${isRTL ? `pr-${collapsed?'16':'[260px]'}` : `pl-${collapsed?'16':'[260px]'}`}
    `}
    style={{ paddingInlineStart: collapsed ? '4rem' : '260px' }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        {searchOpen ? (
          <form onSubmit={handleSearch} className="animate-fade-in">
            <input
              ref={searchRef}
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onBlur={() => { if (!searchVal) setSearchOpen(false); }}
              placeholder={t('search') + '...'}
              className="input text-sm"
            />
          </form>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 text-sm text-gray-400 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors w-full max-w-xs bg-gray-50"
          >
            <Search size={15} />
            <span>{t('search')}...</span>
            <kbd className="ml-auto text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 hidden sm:inline">
              /
            </kbd>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 ms-auto">
        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center gap-1.5 text-xs font-semibold"
          title="Switch language"
        >
          <Globe size={16} />
          <span className="hidden sm:inline">{lang === 'ar' ? 'EN' : 'ع'}</span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 end-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center ms-1"
        >
          <span className="text-xs font-bold text-primary-700">
            {user?.fullName?.[0]?.toUpperCase() || 'U'}
          </span>
        </button>
      </div>
    </header>
  );
}
