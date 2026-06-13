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
    ourServices: 'خدماتنا', boq: 'الحصر والمستخلصات',
    // BOQ & Certificates
    boqPage: 'الحصر', boqSubtitle: 'قوائم الكميات والأسعار',
    boqNew: 'حصر جديد', boqNumber: 'رقم الحصر', boqTitle: 'عنوان الحصر',
    boqDate: 'تاريخ الحصر', boqItems: 'بنود الحصر', boqAddItem: 'إضافة بند',
    boqGrandTotal: 'الإجمالي الكلي', boqItemsCount: 'البنود',
    boqEmpty: 'لا توجد حصور بعد',
    boqEditTitle: 'تعديل الحصر', boqCreateTitle: 'حصر جديد',
    itemCode: 'الكود', itemDesc: 'الوصف', itemUnit: 'الوحدة',
    itemQty: 'الكمية', itemUnitPrice: 'سعر الوحدة', itemTotal: 'الإجمالي',
    boqStatusDraft: 'مسودة', boqStatusApproved: 'معتمد', boqStatusClosed: 'مغلق',
    // Certificates
    certificates: 'المستخلصات', certNew: 'مستخلص جديد',
    certNumber: 'رقم المستخلص', certTitle: 'عنوان المستخلص',
    certType: 'نوع المستخلص', certOwner: 'مستخلص المالك',
    certContractor: 'مستخلص المقاول', certPeriod: 'رقم الفترة',
    certDate: 'تاريخ المستخلص', certBoq: 'الحصر المرجعي',
    certExecutedQty: 'الكمية المنفذة', certBoqQty: 'كمية الحصر',
    certCompletion: 'نسبة الإنجاز',
    certEmpty: 'لا توجد مستخلصات بعد',
    // Comparison
    comparison: 'المقارنة', comparisonTitle: 'مقارنة الحصر بالمستخلصات',
    compBoqTotal: 'إجمالي الحصر', compOwnerTotal: 'إجمالي المالك',
    compContractorTotal: 'إجمالي المقاول', compVariance: 'الفرق',
    alertOk: 'طبيعي', alertWarning: 'تحذير', alertCritical: 'حرج',
    // Procurement / المشتريات
    requisitions: 'طلبات الاحتياج', purchases: 'طلبات الشراء', additionPermits: 'أذونات الإضافة',
    // Warehouse / المستودعات
    warehouseItems: 'كرت الصنف', disbursements: 'أذونات الصرف',
    // Quality Reports
    qualityReports: 'تقارير الجودة',
    project: 'المشروع', noProject: 'بدون مشروع',
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
    ourServices: 'Our Services', boq: 'BOQ & Certificates',
    // BOQ & Certificates
    boqPage: 'Bill of Quantities', boqSubtitle: 'Bills of Quantities & Prices',
    boqNew: 'New BOQ', boqNumber: 'BOQ Number', boqTitle: 'BOQ Title',
    boqDate: 'BOQ Date', boqItems: 'BOQ Items', boqAddItem: 'Add Item',
    boqGrandTotal: 'Grand Total', boqItemsCount: 'Items',
    boqEmpty: 'No BOQs yet',
    boqEditTitle: 'Edit BOQ', boqCreateTitle: 'New BOQ',
    itemCode: 'Code', itemDesc: 'Description', itemUnit: 'Unit',
    itemQty: 'Quantity', itemUnitPrice: 'Unit Price', itemTotal: 'Total',
    boqStatusDraft: 'Draft', boqStatusApproved: 'Approved', boqStatusClosed: 'Closed',
    // Certificates
    certificates: 'Certificates', certNew: 'New Certificate',
    certNumber: 'Cert. Number', certTitle: 'Certificate Title',
    certType: 'Certificate Type', certOwner: 'Owner Certificate',
    certContractor: 'Contractor Certificate', certPeriod: 'Period No.',
    certDate: 'Certificate Date', certBoq: 'Reference BOQ',
    certExecutedQty: 'Executed Qty', certBoqQty: 'BOQ Qty',
    certCompletion: 'Completion %',
    certEmpty: 'No certificates yet',
    // Comparison
    comparison: 'Comparison', comparisonTitle: 'BOQ vs Certificates Comparison',
    compBoqTotal: 'BOQ Total', compOwnerTotal: 'Owner Total',
    compContractorTotal: 'Contractor Total', compVariance: 'Variance',
    alertOk: 'OK', alertWarning: 'Warning', alertCritical: 'Critical',
    project: 'Project', noProject: 'No Project',
    // Procurement
    requisitions: 'Requisitions', purchases: 'Purchases', additionPermits: 'Addition Permits',
    // Warehouse
    warehouseItems: 'Item Cards', disbursements: 'Disbursements',
    // Quality Reports
    qualityReports: 'Quality Reports',
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
