import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare, FileText,
  FileSignature, BarChart3, Upload, BrainCircuit,
  MessageSquare, Bell, Settings, LogOut, Users, Building2,
  ShieldCheck, ChevronLeft, ChevronRight, X, Sparkles,
  Target, UserCircle, Mail, ShieldAlert, TrendingUp, HeartHandshake, Banknote, Briefcase,
  ClipboardList, FileSpreadsheet, FileCheck, ShoppingCart, PackageCheck,
  Warehouse, ArrowUpFromLine,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import toast from 'react-hot-toast';

// ── Nav structure ────────────────────────────────────────────────────────────

const buildSections = (role, lang) => {
  const ar = lang === 'ar';

  // SuperAdmin: platform-only pages
  if (role === 'SuperAdmin') return [
    {
      label: ar ? 'الرئيسية' : 'Main',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
        { to: '/chat',      icon: MessageSquare,   key: 'chat'      },
      ],
    },
    {
      label: ar ? 'الإدارة' : 'Admin',
      items: [
        { to: '/services',                icon: Briefcase,   key: 'ourServices'    },
        { to: '/admin/companies',         icon: Building2,   key: 'company'        },
        { to: '/admin/users',             icon: Users,       key: 'users'          },
        { to: '/settings/email-templates',icon: Mail,        key: 'emailTemplates' },
        { to: '/admin/settings',          icon: ShieldCheck, key: 'admin'          },
      ],
    },
  ];

  // Client: simplified portal
  if (role === 'Client') return [
    {
      label: ar ? 'الرئيسية' : 'Main',
      items: [
        { to: '/dashboard',    icon: LayoutDashboard, key: 'dashboard'    },
        { to: '/client-portal',icon: UserCircle,      key: 'clientPortal' },
        { to: '/projects',     icon: FolderKanban,    key: 'projects'     },
        { to: '/invoices',     icon: FileText,        key: 'invoices'     },
        { to: '/contracts',    icon: FileSignature,   key: 'contracts'    },
        { to: '/chat',         icon: MessageSquare,   key: 'chat'         },
      ],
    },
  ];

  // Base sections (Admin + CompanyUser + Viewer)
  const sections = [
    {
      label: ar ? 'الرئيسية' : 'Main',
      items: [
        { to: '/dashboard',    icon: LayoutDashboard, key: 'dashboard'   },
        { to: '/chat',         icon: MessageSquare,   key: 'chat'        },
        { to: '/ai-dashboard', icon: Sparkles,        key: 'aiDashboard' },
      ],
    },
    {
      label: ar ? 'المشاريع' : 'Projects',
      items: [
        { to: '/projects',   icon: FolderKanban, key: 'projects'   },
        { to: '/tasks',      icon: CheckSquare,  key: 'tasks'      },
        { to: '/milestones', icon: Target,       key: 'milestones' },
        { to: '/risks',      icon: ShieldAlert,  key: 'risks'      },
      ],
    },
    {
      label: ar ? 'المالية' : 'Finance',
      items: [
        { to: '/invoices',  icon: FileText, key: 'invoices'  },
        { to: '/cashflow',  icon: Banknote, key: 'cashFlow'  },
      ],
    },
    {
      label: ar ? 'القطاع الفني' : 'Technical',
      items: [
        { to: '/quality/boq',               icon: FileSpreadsheet, key: 'boqPage'         },
        { to: '/quality/certificates',      icon: FileCheck,       key: 'certificates'    },
        { to: '/procurement/requisitions',  icon: ClipboardList,   key: 'requisitions'    },
        { to: '/procurement/purchases',     icon: ShoppingCart,    key: 'purchases'       },
        { to: '/procurement/permits',       icon: PackageCheck,    key: 'additionPermits' },
        { to: '/warehouse/items',           icon: Warehouse,       key: 'warehouseItems'  },
        { to: '/warehouse/disbursements',   icon: ArrowUpFromLine, key: 'disbursements'   },
        { to: '/quality/reports',           icon: BarChart3,       key: 'qualityReports'  },
      ],
    },
    {
      label: ar ? 'التقارير والتحليل' : 'Reports & Analysis',
      items: [
        { to: '/reports',   icon: BarChart3,    key: 'reports'              },
        { to: '/bi',        icon: TrendingUp,   key: 'businessIntelligence' },
        { to: '/analysis',  icon: BrainCircuit, key: 'analysis'             },
        { to: '/documents', icon: Upload,        key: 'documents'           },
      ],
    },
    {
      label: ar ? 'أخرى' : 'Other',
      items: [
        { to: '/crm',      icon: HeartHandshake, key: 'crm'        },
        { to: '/services', icon: Briefcase,      key: 'ourServices'},
      ],
    },
  ];

  // Admin extras: contracts + user management
  if (role === 'Admin') {
    sections[2].items.push({ to: '/contracts', icon: FileSignature, key: 'contracts' });
    sections.push({
      label: ar ? 'الإدارة' : 'Admin',
      items: [{ to: '/admin/users', icon: Users, key: 'users' }],
    });
  }

  return sections;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth();
  const { t, lang, isRTL } = useLang();
  const navigate             = useNavigate();

  const sections = buildSections(user?.role, lang);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success(t('logout'));
  };

  const sidebarClass = `
    fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full z-40
    bg-white border-${isRTL ? 'l' : 'r'} border-gray-200
    flex flex-col transition-all duration-300 ease-in-out
    ${collapsed ? 'w-16' : 'w-[260px]'}
    ${mobileOpen ? 'translate-x-0' : isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
  `;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside className={sidebarClass}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100">
          {!collapsed && (
            <div className="flex items-center animate-fade-in">
              <img src="/scg-logo.png" alt="SCG" className="h-9 w-auto object-contain" />
            </div>
          )}
          {collapsed && (
            <img src="/scg-logo.png" alt="SCG" className="w-8 h-8 object-contain mx-auto" />
          )}
          <div className="flex items-center gap-1">
            <button onClick={onMobileClose} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <X size={18} />
            </button>
            <button
              onClick={onToggle}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              {collapsed
                ? (isRTL ? <ChevronLeft size={18}/> : <ChevronRight size={18}/>)
                : (isRTL ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>)
              }
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {sections.map((section, si) => (
            <div key={si} className={si > 0 ? 'mt-1' : ''}>
              {/* Section label — hidden when collapsed */}
              {!collapsed && (
                <p className={`
                  px-2 pb-1 text-[10px] font-semibold tracking-widest uppercase select-none
                  text-gray-400
                  ${si > 0 ? 'pt-3 border-t border-gray-100 mt-1' : 'pt-1'}
                `}>
                  {section.label}
                </p>
              )}
              {/* Divider when collapsed (except first section) */}
              {collapsed && si > 0 && (
                <div className="my-2 mx-2 border-t border-gray-100" />
              )}

              <div className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, key }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onMobileClose}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
                    }
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed && <span className="truncate">{t(key)}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-gray-100 space-y-0.5">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
          >
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary-700">
                {user?.fullName?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{user?.fullName}</p>
                <p className="text-[11px] text-gray-400 truncate">{user?.role}</p>
              </div>
            )}
          </NavLink>
          <button
            onClick={handleLogout}
            className={`sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600 ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
