import { createContext, useContext, useState, useEffect } from 'react';

const LangContext = createContext(null);

const translations = {
  ar: {
    // Navigation
    dashboard: 'لوحة التحكم', aiDashboard: 'التحليل الذكي', projects: 'المشاريع', tasks: 'المهام',
    invoices: 'الفواتير', contracts: 'العقود', reports: 'التقارير',
    timeEntries: 'سجل الوقت', documents: 'المستندات', analysis: 'التحليل',
    chat: 'المساعد الذكي', notifications: 'الإشعارات', settings: 'الإعدادات',
    profile: 'الملف الشخصي', logout: 'تسجيل الخروج', admin: 'الإدارة',
    users: 'المستخدمين', company: 'الشركة',
    milestones: 'المراحل', clientPortal: 'بوابة العميل', emailTemplates: 'قوالب الإيميل',
    risks: 'إدارة المخاطر', businessIntelligence: 'ذكاء الأعمال', crm: 'إدارة العملاء', cashFlow: 'التدفق النقدي',
    ourServices: 'خدماتنا',
    // Common
    save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل',
    add: 'إضافة', search: 'بحث', filter: 'تصفية', loading: 'جار التحميل...',
    noData: 'لا توجد بيانات', confirm: 'تأكيد', back: 'رجوع',
    create: 'إنشاء', update: 'تحديث', view: 'عرض', close: 'إغلاق',
    submit: 'إرسال', next: 'التالي', previous: 'السابق', total: 'المجموع',
    status: 'الحالة', date: 'التاريخ', name: 'الاسم', email: 'البريد الإلكتروني',
    phone: 'الهاتف', description: 'الوصف', notes: 'ملاحظات',
    actions: 'الإجراءات', amount: 'المبلغ', currency: 'العملة',
    from: 'من', to: 'إلى', all: 'الكل', yes: 'نعم', no: 'لا',
    // Auth
    login: 'تسجيل الدخول', register: 'إنشاء حساب', password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور', forgotPassword: 'نسيت كلمة المرور؟',
    resetPassword: 'إعادة تعيين كلمة المرور', fullName: 'الاسم الكامل',
    companyName: 'اسم الشركة', welcomeBack: 'مرحباً بك مجدداً',
    // Status
    active: 'نشط', inactive: 'غير نشط', pending: 'قيد الانتظار',
    completed: 'مكتمل', cancelled: 'ملغي', draft: 'مسودة',
    sent: 'مرسل', paid: 'مدفوع', overdue: 'متأخر',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard', aiDashboard: 'AI Analysis', projects: 'Projects', tasks: 'Tasks',
    invoices: 'Invoices', contracts: 'Contracts', reports: 'Reports',
    timeEntries: 'Time Entries', documents: 'Documents', analysis: 'Analysis',
    chat: 'AI Assistant', notifications: 'Notifications', settings: 'Settings',
    profile: 'Profile', logout: 'Logout', admin: 'Administration',
    users: 'Users', company: 'Company',
    milestones: 'Milestones', clientPortal: 'Client Portal', emailTemplates: 'Email Templates',
    risks: 'Risk Management', businessIntelligence: 'Business Intelligence', crm: 'CRM', cashFlow: 'Cash Flow',
    ourServices: 'Our Services',
    // Common
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
    add: 'Add', search: 'Search', filter: 'Filter', loading: 'Loading...',
    noData: 'No data available', confirm: 'Confirm', back: 'Back',
    create: 'Create', update: 'Update', view: 'View', close: 'Close',
    submit: 'Submit', next: 'Next', previous: 'Previous', total: 'Total',
    status: 'Status', date: 'Date', name: 'Name', email: 'Email',
    phone: 'Phone', description: 'Description', notes: 'Notes',
    actions: 'Actions', amount: 'Amount', currency: 'Currency',
    from: 'From', to: 'To', all: 'All', yes: 'Yes', no: 'No',
    // Auth
    login: 'Login', register: 'Register', password: 'Password',
    confirmPassword: 'Confirm Password', forgotPassword: 'Forgot password?',
    resetPassword: 'Reset Password', fullName: 'Full Name',
    companyName: 'Company Name', welcomeBack: 'Welcome back',
    // Status
    active: 'Active', inactive: 'Inactive', pending: 'Pending',
    completed: 'Completed', cancelled: 'Cancelled', draft: 'Draft',
    sent: 'Sent', paid: 'Paid', overdue: 'Overdue',
  },
};

export function LangProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'ar');

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t  = (key) => translations[lang]?.[key] ?? key;
  const isRTL = lang === 'ar';

  const toggleLang = () => setLang(p => p === 'ar' ? 'en' : 'ar');

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t, isRTL }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be inside LangProvider');
  return ctx;
};
