import { useLang } from '../../context/LangContext';

const SERVICES = {
  ar: [
    {
      num: '01',
      icon: '🎯',
      color: 'from-blue-500 to-blue-700',
      lightColor: 'bg-blue-50 border-blue-200',
      iconBg: 'bg-blue-100 text-blue-700',
      title: 'الاستراتيجية وتطوير الأعمال',
      subtitle: 'Strategy & Business Growth',
      desc: 'نساعدك على بناء رؤية واضحة وخطة استراتيجية قابلة للتنفيذ تُحوّل أهدافك إلى نتائج ملموسة وقابلة للقياس.',
      bullets: [
        'تحليل السوق وتحديد الفرص التنافسية',
        'صياغة الرؤية والرسالة والأهداف الاستراتيجية',
        'خطط النمو والتوسع المحلي والإقليمي',
        'نماذج الأعمال المستدامة وقياس الأثر',
      ],
      tags: ['Vision & Mission', 'Market Analysis', 'Growth Plans'],
    },
    {
      num: '02',
      icon: '📊',
      color: 'from-emerald-500 to-emerald-700',
      lightColor: 'bg-emerald-50 border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-700',
      title: 'الأداء والمؤشرات',
      subtitle: 'Performance & KPIs',
      desc: 'نصمم أنظمة قياس أداء دقيقة تُمكّن القيادة من اتخاذ قرارات مبنية على البيانات ومتابعة التقدم لحظياً.',
      bullets: [
        'تصميم مؤشرات الأداء الرئيسية (KPIs) المخصصة',
        'لوحات بيانات تفاعلية للإدارة التنفيذية',
        'تقارير دورية وتحليل الفجوات والانحرافات',
        'ربط الأداء الفردي بالأهداف المؤسسية',
      ],
      tags: ['KPI Design', 'Dashboards', 'Performance Reports'],
    },
    {
      num: '03',
      icon: '🏛️',
      color: 'from-purple-500 to-purple-700',
      lightColor: 'bg-purple-50 border-purple-200',
      iconBg: 'bg-purple-100 text-purple-700',
      title: 'الهيكلة المؤسسية',
      subtitle: 'Organizational Excellence',
      desc: 'نُعيد تصميم الهياكل التنظيمية لتُحقق أقصى كفاءة وتوضح المسؤوليات وتدعم تحقيق الأهداف الاستراتيجية.',
      bullets: [
        'تشخيص الهياكل التنظيمية الحالية وتحديد الفجوات',
        'إعادة تصميم الهيكل الوظيفي والتسلسل القيادي',
        'تحديد الأدوار والمسؤوليات والصلاحيات',
        'تطوير السياسات والإجراءات التشغيلية',
      ],
      tags: ['Org Design', 'SOPs', 'Role Clarity'],
    },
    {
      num: '04',
      icon: '🤖',
      color: 'from-cyan-500 to-cyan-700',
      lightColor: 'bg-cyan-50 border-cyan-200',
      iconBg: 'bg-cyan-100 text-cyan-700',
      title: 'التحول الرقمي والذكاء الاصطناعي',
      subtitle: 'Digital Transformation & AI',
      desc: 'نقود رحلتك الرقمية الكاملة من تقييم الوضع الراهن إلى تطبيق تقنيات الذكاء الاصطناعي في صميم عملياتك.',
      bullets: [
        'تقييم النضج الرقمي ووضع خارطة طريق التحول',
        'أتمتة العمليات وتطبيق حلول الذكاء الاصطناعي',
        'تطوير أنظمة ERP وبرمجيات مخصصة',
        'تحليل البيانات الضخمة واستخلاص الرؤى',
      ],
      tags: ['AI Solutions', 'ERP', 'Process Automation'],
    },
    {
      num: '05',
      icon: '🛡️',
      color: 'from-red-500 to-red-700',
      lightColor: 'bg-red-50 border-red-200',
      iconBg: 'bg-red-100 text-red-700',
      title: 'إدارة المخاطر والحوكمة',
      subtitle: 'Risk & Governance',
      desc: 'نبني أطر حوكمة وإدارة مخاطر متكاملة تحمي مؤسستك وتُرسّخ ثقافة الامتثال والشفافية.',
      bullets: [
        'تحليل المخاطر المؤسسية وتقييم احتمالات الوقوع',
        'بناء إطار الحوكمة والرقابة الداخلية',
        'خطط الاستمرارية وإدارة الأزمات',
        'الامتثال للمعايير الدولية (ISO, Basel)',
      ],
      tags: ['Risk Assessment', 'Governance Framework', 'Compliance'],
    },
    {
      num: '06',
      icon: '💡',
      color: 'from-amber-500 to-amber-700',
      lightColor: 'bg-amber-50 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-700',
      title: 'الاستثمار والابتكار',
      subtitle: 'Investment & Innovation',
      desc: 'نرشدك في قرارات الاستثمار ونبني ثقافة الابتكار لضمان نمو مستدام وميزة تنافسية طويلة الأمد.',
      bullets: [
        'دراسات الجدوى وتقييم الفرص الاستثمارية',
        'تقييم المشاريع وعمليات الدمج والاستحواذ',
        'بناء مختبرات الابتكار والتحول الريادي',
        'إدارة المحافظ الاستثمارية وقياس العوائد',
      ],
      tags: ['Feasibility Studies', 'M&A', 'Innovation Labs'],
    },
    {
      num: '07',
      icon: '🎓',
      color: 'from-indigo-500 to-indigo-700',
      lightColor: 'bg-indigo-50 border-indigo-200',
      iconBg: 'bg-indigo-100 text-indigo-700',
      title: 'التدريب والتطوير القيادي',
      subtitle: 'Leadership & Capability Building',
      desc: 'نطوّر كفاءات فريقك القيادي والتنفيذي من خلال برامج تدريبية مخصصة تُحدث أثراً حقيقياً في الأداء.',
      bullets: [
        'برامج تطوير القيادة التنفيذية والإدارة الوسطى',
        'معسكرات إدارة المشاريع والتحول الرقمي',
        'برامج تنمية المهارات الناعمة والتواصل الفعّال',
        'التدريب على أدوات الذكاء الاصطناعي في بيئة العمل',
      ],
      tags: ['Executive Development', 'Bootcamps', 'Leadership Skills'],
    },
  ],
  en: [
    {
      num: '01',
      icon: '🎯',
      color: 'from-blue-500 to-blue-700',
      lightColor: 'bg-blue-50 border-blue-200',
      iconBg: 'bg-blue-100 text-blue-700',
      title: 'Strategy & Business Growth',
      subtitle: 'الاستراتيجية وتطوير الأعمال',
      desc: 'We help you build a clear vision and actionable strategic plan that transforms your goals into measurable, tangible results.',
      bullets: [
        'Market analysis and competitive opportunity identification',
        'Vision, mission, and strategic goal formulation',
        'Local and regional growth and expansion plans',
        'Sustainable business models and impact measurement',
      ],
      tags: ['Vision & Mission', 'Market Analysis', 'Growth Plans'],
    },
    {
      num: '02',
      icon: '📊',
      color: 'from-emerald-500 to-emerald-700',
      lightColor: 'bg-emerald-50 border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-700',
      title: 'Performance & KPIs',
      subtitle: 'الأداء والمؤشرات',
      desc: 'We design precise performance measurement systems that enable leadership to make data-driven decisions and track progress in real time.',
      bullets: [
        'Custom KPI design and performance frameworks',
        'Interactive executive dashboards',
        'Periodic reports, gap analysis, and variance tracking',
        'Linking individual performance to institutional objectives',
      ],
      tags: ['KPI Design', 'Dashboards', 'Performance Reports'],
    },
    {
      num: '03',
      icon: '🏛️',
      color: 'from-purple-500 to-purple-700',
      lightColor: 'bg-purple-50 border-purple-200',
      iconBg: 'bg-purple-100 text-purple-700',
      title: 'Organizational Excellence',
      subtitle: 'الهيكلة المؤسسية',
      desc: 'We redesign organizational structures to maximize efficiency, clarify responsibilities, and support the achievement of strategic goals.',
      bullets: [
        'Diagnosis of current org structures and gap identification',
        'Functional structure redesign and leadership hierarchy',
        'Role, responsibility, and authority definition',
        'Policy and operational procedure development',
      ],
      tags: ['Org Design', 'SOPs', 'Role Clarity'],
    },
    {
      num: '04',
      icon: '🤖',
      color: 'from-cyan-500 to-cyan-700',
      lightColor: 'bg-cyan-50 border-cyan-200',
      iconBg: 'bg-cyan-100 text-cyan-700',
      title: 'Digital Transformation & AI',
      subtitle: 'التحول الرقمي والذكاء الاصطناعي',
      desc: 'We lead your complete digital journey from assessing the current state to embedding AI technologies at the core of your operations.',
      bullets: [
        'Digital maturity assessment and transformation roadmap',
        'Process automation and AI solution implementation',
        'ERP development and custom software solutions',
        'Big data analytics and insight extraction',
      ],
      tags: ['AI Solutions', 'ERP', 'Process Automation'],
    },
    {
      num: '05',
      icon: '🛡️',
      color: 'from-red-500 to-red-700',
      lightColor: 'bg-red-50 border-red-200',
      iconBg: 'bg-red-100 text-red-700',
      title: 'Risk & Governance',
      subtitle: 'إدارة المخاطر والحوكمة',
      desc: 'We build comprehensive governance and risk management frameworks that protect your organization and embed a culture of compliance and transparency.',
      bullets: [
        'Enterprise risk analysis and probability assessment',
        'Governance framework and internal control design',
        'Business continuity and crisis management plans',
        'International standards compliance (ISO, Basel)',
      ],
      tags: ['Risk Assessment', 'Governance Framework', 'Compliance'],
    },
    {
      num: '06',
      icon: '💡',
      color: 'from-amber-500 to-amber-700',
      lightColor: 'bg-amber-50 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-700',
      title: 'Investment & Innovation',
      subtitle: 'الاستثمار والابتكار',
      desc: 'We guide your investment decisions and build a culture of innovation to ensure sustainable growth and long-term competitive advantage.',
      bullets: [
        'Feasibility studies and investment opportunity evaluation',
        'Project valuation, M&A advisory',
        'Innovation labs and entrepreneurial transformation',
        'Portfolio management and return measurement',
      ],
      tags: ['Feasibility Studies', 'M&A', 'Innovation Labs'],
    },
    {
      num: '07',
      icon: '🎓',
      color: 'from-indigo-500 to-indigo-700',
      lightColor: 'bg-indigo-50 border-indigo-200',
      iconBg: 'bg-indigo-100 text-indigo-700',
      title: 'Leadership & Capability Building',
      subtitle: 'التدريب والتطوير القيادي',
      desc: 'We develop your leadership and executive team\'s competencies through customized training programs that create real impact on performance.',
      bullets: [
        'Executive leadership and mid-management development',
        'Project management and digital transformation bootcamps',
        'Soft skills and effective communication programs',
        'AI tools training for workplace application',
      ],
      tags: ['Executive Development', 'Bootcamps', 'Leadership Skills'],
    },
  ],
};

export default function ServicesPage() {
  const { lang, isRTL } = useLang();
  const services = SERVICES[lang] ?? SERVICES.ar;
  const isAr = lang === 'ar';

  return (
    <div className="space-y-8 pb-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white">
        <p className="text-primary-200 text-sm font-medium mb-2">
          {isAr ? 'Shabana Consulting Group — SCG' : 'Shabana Consulting Group — SCG'}
        </p>
        <h1 className="text-3xl font-bold mb-3">
          {isAr ? 'خدماتنا الاستشارية' : 'Our Consulting Services'}
        </h1>
        <p className="text-primary-100 text-base max-w-2xl">
          {isAr
            ? 'نقدم حلولاً استشارية متكاملة في 7 مجالات تغطي كل جوانب تطوير وتحويل المؤسسات نحو النجاح المستدام.'
            : 'We offer comprehensive consulting solutions across 7 domains covering all aspects of organizational development and transformation toward sustainable success.'
          }
        </p>
        <div className="flex flex-wrap gap-3 mt-5">
          {[isAr ? '7 خدمات متخصصة' : '7 Specialized Services',
            isAr ? 'مصر والخليج' : 'Egypt & Gulf',
            isAr ? 'حلول مخصصة' : 'Tailored Solutions'].map(tag => (
            <span key={tag} className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {services.map((svc) => (
          <div
            key={svc.num}
            className={`border rounded-2xl p-6 hover:shadow-lg transition-all duration-200 ${svc.lightColor}`}
          >
            {/* Card Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${svc.iconBg}`}>
                {svc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-400">{svc.num}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{svc.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{svc.subtitle}</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{svc.desc}</p>

            {/* Bullets */}
            <ul className="space-y-2 mb-4">
              {svc.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {svc.tags.map(tag => (
                <span key={tag} className="bg-white/80 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA Banner */}
      <div className="bg-gray-900 rounded-2xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-3">
          {isAr ? 'مستعد للبدء؟' : 'Ready to Get Started?'}
        </h2>
        <p className="text-gray-400 mb-6 max-w-lg mx-auto">
          {isAr
            ? 'تواصل مع فريقنا الاستشاري لتحديد الخدمة الأنسب لاحتياجات مؤسستك وبدء رحلة التحول.'
            : 'Connect with our consulting team to identify the right service for your organization and start your transformation journey.'
          }
        </p>
        <a
          href="mailto:info@shabana-consulting.com"
          className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          {isAr ? 'تواصل معنا' : 'Contact Us'}
        </a>
      </div>
    </div>
  );
}
