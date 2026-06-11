import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import './LandingPage.css';

// ── Bilingual Content ─────────────────────────────────────────────────────────
const CONTENT = {
  ar: {
    badge: 'مصر · الخليج · الرقمي',
    heroTitle: 'نعيد تعريف إدارة المشاريع\nبذكاء المستقبل',
    heroSub: 'كيان استشاري رائد يجمع بين الخبرة الهندسية العميقة وتقنيات الذكاء الاصطناعي، لتحويل البيانات المعقدة إلى قرارات رابحة.',
    ctaChat: 'تحدث مع مستشارنا الذكي',
    ctaServices: 'اكتشف خدماتنا',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    goToDashboard: 'لوحة التحكم ←',
    stats: [
      { num: 'PMO', label: 'مكاتب إدارة مشاريع ذكية' },
      { num: 'AI',  label: 'أتمتة كاملة للتقارير'   },
      { num: 'ROI', label: 'أعلى عائد على الاستثمار' },
    ],
    servicesLabel: 'ما نقدمه',
    servicesTitle: 'خدماتنا الرئيسية',
    services: [
      {
        num: '01', icon: '🎯',
        title: 'الاستراتيجية وتطوير الأعمال',
        desc: 'نساعدك على بناء رؤية واضحة وخطة استراتيجية قابلة للتنفيذ تُحوّل أهدافك إلى نتائج ملموسة وقابلة للقياس.',
        bullets: ['تحليل السوق وتحديد الفرص التنافسية', 'صياغة الرؤية والرسالة والأهداف الاستراتيجية', 'خطط النمو والتوسع المحلي والإقليمي', 'نماذج الأعمال المستدامة وقياس الأثر'],
        tags: ['Vision & Mission', 'Market Analysis', 'Growth Plans'],
      },
      {
        num: '02', icon: '📊',
        title: 'الأداء والمؤشرات',
        desc: 'نصمم أنظمة قياس أداء دقيقة وداشبوردات تفاعلية تُمكّن القيادة من اتخاذ قرارات مبنية على البيانات.',
        bullets: ['تصميم مؤشرات الأداء الرئيسية (KPIs) المخصصة', 'لوحات بيانات تفاعلية للإدارة التنفيذية', 'تقارير دورية وتحليل الفجوات والانحرافات', 'ربط الأداء الفردي بالأهداف المؤسسية'],
        tags: ['KPI Design', 'Dashboards', 'Performance Reports'],
      },
      {
        num: '03', icon: '🏛️',
        title: 'الهيكلة المؤسسية',
        desc: 'نُعيد تصميم الهياكل التنظيمية لتُحقق أقصى كفاءة وتوضح المسؤوليات وتدعم الأهداف الاستراتيجية.',
        bullets: ['تشخيص الهياكل التنظيمية الحالية وتحديد الفجوات', 'إعادة تصميم الهيكل الوظيفي والتسلسل القيادي', 'تحديد الأدوار والمسؤوليات والصلاحيات', 'تطوير السياسات والإجراءات التشغيلية'],
        tags: ['Org Design', 'SOPs', 'Role Clarity'],
      },
      {
        num: '04', icon: '🤖',
        title: 'التحول الرقمي والذكاء الاصطناعي',
        desc: 'نقود رحلتك الرقمية الكاملة من تقييم الوضع الراهن إلى تطبيق تقنيات الذكاء الاصطناعي في صميم عملياتك.',
        bullets: ['تقييم النضج الرقمي ووضع خارطة طريق التحول', 'أتمتة العمليات وتطبيق حلول الذكاء الاصطناعي', 'تطوير أنظمة ERP وبرمجيات مخصصة', 'تحليل البيانات الضخمة واستخلاص الرؤى'],
        tags: ['AI Solutions', 'ERP', 'Process Automation'],
      },
      {
        num: '05', icon: '🛡️',
        title: 'إدارة المخاطر والحوكمة',
        desc: 'نبني أطر حوكمة وإدارة مخاطر متكاملة تحمي مؤسستك وتُرسّخ ثقافة الامتثال والشفافية.',
        bullets: ['تحليل المخاطر المؤسسية وتقييم احتمالات الوقوع', 'بناء إطار الحوكمة والرقابة الداخلية', 'خطط الاستمرارية وإدارة الأزمات', 'الامتثال للمعايير الدولية (ISO, Basel)'],
        tags: ['Risk Assessment', 'Governance Framework', 'Compliance'],
      },
      {
        num: '06', icon: '💡',
        title: 'الاستثمار والابتكار',
        desc: 'نرشدك في قرارات الاستثمار ونبني ثقافة الابتكار لضمان نمو مستدام وميزة تنافسية طويلة الأمد.',
        bullets: ['دراسات الجدوى وتقييم الفرص الاستثمارية', 'تقييم المشاريع وعمليات الدمج والاستحواذ', 'بناء مختبرات الابتكار والتحول الريادي', 'إدارة المحافظ الاستثمارية وقياس العوائد'],
        tags: ['Feasibility Studies', 'M&A', 'Innovation Labs'],
      },
      {
        num: '07', icon: '🎓',
        title: 'التدريب والتطوير القيادي',
        desc: 'نطوّر كفاءات فريقك القيادي والتنفيذي من خلال برامج تدريبية مخصصة تُحدث أثراً حقيقياً في الأداء.',
        bullets: ['برامج تطوير القيادة التنفيذية والإدارة الوسطى', 'معسكرات إدارة المشاريع والتحول الرقمي', 'برامج تنمية المهارات الناعمة والتواصل الفعّال', 'التدريب على أدوات الذكاء الاصطناعي في بيئة العمل'],
        tags: ['Executive Development', 'Bootcamps', 'Leadership Skills'],
      },
    ],
    chatLabel: 'مستشارنا الذكي',
    chatTitle: 'تحدث معنا الآن\nواعرف كيف نساعدك',
    chatSub: 'اسألنا عن أي خدمة، أو كيفية بدء التعاون — نحن هنا.',
    chatHeaderTitle: 'مستشار Shabana Consulting الذكي',
    chatPlaceholder: 'اكتب سؤالك هنا...',
    chatWelcome: 'مرحباً بك في Shabana Consulting 👋\nأنا مستشارك الذكي، يسعدني مساعدتك في التعرف على خدماتنا وكيف نستطيع تطوير مشروعك.\n\nبماذا يمكنني مساعدتك اليوم؟',
    quickBtns: ['خدماتنا', 'لماذا نحن؟', 'ابدأ التعاون', 'PMO الذكي', 'الأسواق'],
    whyLabel: 'ميزتنا',
    whyTitle: 'لماذا نختار Shabana Consulting؟',
    why: [
      { icon: '🏗️', title: 'الخبرة الفنية العميقة',   desc: 'خلفية هندسية قوية تدرك تحديات المواقع والشركات على أرض الواقع بعمق واحترافية.' },
      { icon: '🤖', title: 'السبق في الذكاء الاصطناعي', desc: 'من أوائل المكاتب التي تدمج الذكاء الاصطناعي بشكل تطبيقي حقيقي في قطاع التشييد.' },
      { icon: '📊', title: 'التركيز على النتائج',      desc: 'لا نقدم تقارير ورقية بل حلولاً ملموسة ترفع من ربحية مشروعك بشكل مباشر وقابل للقياس.' },
    ],
    ctaBannerTitle: 'هل أنت مستعد لتحويل مشروعك؟',
    ctaBannerSub: 'انضم إلى المنصة اليوم وابدأ رحلتك نحو إدارة مشاريع أذكى وأكثر ربحية.',
    ctaBannerBtn: 'ابدأ مجاناً الآن',
    footerTagline: 'نعيد تعريف إدارة المشاريع بذكاء المستقبل · مصر والخليج',
    footerLinks: [
      { label: 'تسجيل الدخول', to: '/login' },
      { label: 'إنشاء حساب',  to: '/register' },
    ],
  },
  en: {
    badge: 'Egypt · Gulf · Digital',
    heroTitle: 'Redefining Project Management\nwith Future Intelligence',
    heroSub: 'A leading consulting entity combining deep engineering expertise with AI technologies, transforming complex data into winning decisions.',
    ctaChat: 'Talk to Our AI Advisor',
    ctaServices: 'Explore Services',
    login: 'Login',
    register: 'Get Started',
    goToDashboard: 'Dashboard →',
    stats: [
      { num: 'PMO', label: 'Smart Project Management Offices' },
      { num: 'AI',  label: 'Full Report Automation'          },
      { num: 'ROI', label: 'Highest Return on Investment'    },
    ],
    servicesLabel: 'What We Offer',
    servicesTitle: 'Our Core Services',
    services: [
      {
        num: '01', icon: '🎯',
        title: 'Strategy & Business Growth',
        desc: 'We help you build a clear vision and actionable strategic plan that transforms your goals into measurable, tangible results.',
        bullets: ['Market analysis and competitive opportunity identification', 'Vision, mission, and strategic objectives formulation', 'Local and regional growth and expansion plans', 'Sustainable business models and impact measurement'],
        tags: ['Vision & Mission', 'Market Analysis', 'Growth Plans'],
      },
      {
        num: '02', icon: '📊',
        title: 'Performance & KPIs',
        desc: 'We design precise performance measurement systems and interactive dashboards enabling data-driven leadership decisions.',
        bullets: ['Custom KPI design for every organizational level', 'Interactive executive dashboards and real-time reporting', 'Periodic variance analysis and gap identification', 'Linking individual performance to institutional objectives'],
        tags: ['KPI Design', 'Dashboards', 'Performance Reports'],
      },
      {
        num: '03', icon: '🏛️',
        title: 'Organizational Excellence',
        desc: 'We redesign organizational structures to maximize efficiency, clarify responsibilities, and support strategic goals.',
        bullets: ['Diagnosing current org structures and identifying gaps', 'Redesigning functional hierarchy and leadership chains', 'Defining roles, responsibilities, and authority levels', 'Developing policies and standard operating procedures'],
        tags: ['Org Design', 'SOPs', 'Role Clarity'],
      },
      {
        num: '04', icon: '🤖',
        title: 'Digital Transformation & AI',
        desc: 'We lead your complete digital journey from assessing the current state to embedding AI technologies at the core of your operations.',
        bullets: ['Digital maturity assessment and transformation roadmap', 'Process automation and AI solution implementation', 'ERP development and custom software solutions', 'Big data analytics and actionable insight generation'],
        tags: ['AI Solutions', 'ERP', 'Process Automation'],
      },
      {
        num: '05', icon: '🛡️',
        title: 'Risk & Governance',
        desc: 'We build comprehensive governance and risk management frameworks that protect your organization and embed compliance culture.',
        bullets: ['Institutional risk analysis and probability assessment', 'Governance framework and internal control design', 'Business continuity planning and crisis management', 'Compliance with international standards (ISO, Basel)'],
        tags: ['Risk Assessment', 'Governance Framework', 'Compliance'],
      },
      {
        num: '06', icon: '💡',
        title: 'Investment & Innovation',
        desc: 'We guide your investment decisions and build an innovation culture for sustainable growth and long-term competitive advantage.',
        bullets: ['Feasibility studies and investment opportunity evaluation', 'Project valuation and M&A advisory services', 'Innovation labs and entrepreneurial transformation', 'Portfolio management and return on investment analysis'],
        tags: ['Feasibility Studies', 'M&A', 'Innovation Labs'],
      },
      {
        num: '07', icon: '🎓',
        title: 'Leadership & Capability Building',
        desc: 'We develop your leadership and executive team\'s competencies through customized training programs that create real performance impact.',
        bullets: ['Executive and middle-management leadership programs', 'Project management and digital transformation bootcamps', 'Soft skills and effective communication development', 'AI tools training for workplace application'],
        tags: ['Executive Development', 'Bootcamps', 'Leadership Skills'],
      },
    ],
    chatLabel: 'Our AI Advisor',
    chatTitle: 'Talk to Us Now\nand Discover How We Can Help',
    chatSub: 'Ask about any service or how to start working with us — we\'re here.',
    chatHeaderTitle: 'Shabana Consulting AI Advisor',
    chatPlaceholder: 'Type your question here...',
    chatWelcome: 'Welcome to Shabana Consulting 👋\nI\'m your AI advisor, happy to help you learn about our services and how we can develop your project.\n\nHow can I help you today?',
    quickBtns: ['Our Services', 'Why Us?', 'Start Partnership', 'Smart PMO', 'Markets'],
    whyLabel: 'Our Edge',
    whyTitle: 'Why Choose Shabana Consulting?',
    why: [
      { icon: '🏗️', title: 'Deep Technical Expertise',       desc: 'Strong engineering background that truly understands on-site challenges faced by companies professionally.' },
      { icon: '🤖', title: 'AI-First Approach',               desc: 'Among the first offices to practically integrate AI in the construction sector in a real, applied way.' },
      { icon: '📊', title: 'Results-Focused',                 desc: 'We don\'t deliver paper reports — we deliver tangible solutions that directly and measurably improve your project\'s profitability.' },
    ],
    ctaBannerTitle: 'Ready to Transform Your Project?',
    ctaBannerSub: 'Join the platform today and start your journey toward smarter, more profitable project management.',
    ctaBannerBtn: 'Start for Free',
    footerTagline: 'Redefining Project Management with Future Intelligence · Egypt & Gulf',
    footerLinks: [
      { label: 'Login',     to: '/login'    },
      { label: 'Register',  to: '/register' },
    ],
  },
};

// ── Demo AI Responses ─────────────────────────────────────────────────────────
const DEMO = {
  ar: {
    default: 'شكراً لتواصلك! يسعدني مساعدتك. هل تريد التعرف على خدماتنا أو كيفية بدء التعاون معنا؟',
    services: '✅ نقدم 7 خدمات استشارية متخصصة:\n1. الاستراتيجية وتطوير الأعمال\n2. الأداء والمؤشرات (KPIs)\n3. الهيكلة المؤسسية\n4. التحول الرقمي والذكاء الاصطناعي\n5. إدارة المخاطر والحوكمة\n6. الاستثمار والابتكار\n7. التدريب والتطوير القيادي\n\nأي خدمة تريد معرفة المزيد عنها؟',
    pmo: '🏗️ مكتب إدارة المشاريع الذكي (AI-Driven PMO) هو حل متكامل يجمع بين أفضل ممارسات PM وتقنيات الذكاء الاصطناعي:\n• أتمتة التقارير اليومية والأسبوعية\n• التنبؤ بمواعيد التسليم\n• مراقبة التكاليف لحظياً\n• لوحات بيانات تفاعلية',
    start: '🚀 للبدء في التعاون:\n1. أنشئ حساباً على المنصة\n2. سيتواصل معك فريقنا خلال 24 ساعة\n3. نحدد احتياجاتك ونصمم الحل المناسب\n\nانقر على "إنشاء حساب" للبدء الآن!',
    why: '⭐ نتميز بـ 3 عوامل:\n• خبرة هندسية عميقة في المواقع\n• أوائل من يدمج AI في قطاع التشييد تطبيقياً\n• تركيزنا على النتائج الملموسة لا التقارير النظرية',
    markets: '🌍 نخدم بشكل رئيسي:\n• مصر — شركات المقاولات الكبرى\n• منطقة الخليج العربي\n• المشاريع الرقمية والتحول التكنولوجي\n\nلدينا خبرة واسعة في كلا السوقين.',
  },
  en: {
    default: 'Thank you for reaching out! I\'m happy to help. Would you like to learn about our services or how to start working with us?',
    services: '✅ We offer 4 core services:\n1. AI-Driven PMO Setup\n2. Digital Transformation Consulting\n3. Leaders Academy (Bootcamps)\n4. Smart Asset & Investment Management\n\nWhich service would you like to know more about?',
    pmo: '🏗️ An AI-Driven PMO is an integrated solution combining best PM practices with AI:\n• Automated daily & weekly reports\n• Delivery date prediction\n• Real-time cost monitoring\n• Interactive dashboards',
    start: '🚀 To start working with us:\n1. Create an account on the platform\n2. Our team will contact you within 24 hours\n3. We\'ll identify your needs and design the right solution\n\nClick "Get Started" to begin now!',
    why: '⭐ We stand out with 3 key factors:\n• Deep engineering expertise on-site\n• Among the first to integrate AI practically in construction\n• Focus on tangible results, not theoretical reports',
    markets: '🌍 We primarily serve:\n• Egypt — major contracting companies\n• Gulf region\n• Digital & technology transformation projects\n\nWe have extensive experience in both markets.',
  },
};

function getDemoResponse(text, lang) {
  const t = text.toLowerCase();
  const r = DEMO[lang];
  if (t.includes('خدم') || t.includes('service')) return r.services;
  if (t.includes('pmo') || t.includes('مشروع') || t.includes('project')) return r.pmo;
  if (t.includes('تعاون') || t.includes('ابدأ') || t.includes('start') || t.includes('begin')) return r.start;
  if (t.includes('لماذا') || t.includes('why') || t.includes('ميزة') || t.includes('edge')) return r.why;
  if (t.includes('سوق') || t.includes('market') || t.includes('egypt') || t.includes('مصر')) return r.markets;
  return r.default;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { user } = useAuth();
  const { lang, toggleLang } = useLang();
  const navigate = useNavigate();

  const c = CONTENT[lang] || CONTENT.ar;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Chat state
  const [messages, setMessages] = useState([
    { role: 'bot', text: c.chatWelcome },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const chatSectionRef = useRef(null);

  // Reset welcome message when lang changes
  useEffect(() => {
    setMessages([{ role: 'bot', text: CONTENT[lang].chatWelcome }]);
  }, [lang]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || inputVal).trim();
    if (!trimmed || isTyping) return;
    setInputVal('');
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
    setIsTyping(false);
    setMessages((prev) => [...prev, { role: 'bot', text: getDemoResponse(trimmed, lang) }]);
  }, [inputVal, isTyping, lang]);

  // Scroll-reveal for cards — re-observe whenever lang changes (new DOM nodes after re-render)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.lp-service-card, .lp-why-card').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [lang]);

  const scrollToChat = () => {
    chatSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => document.getElementById('lp-chat-input')?.focus(), 700);
  };

  const scrollToServices = () => {
    document.getElementById('lp-services')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="lp" dir={dir} lang={lang}>

      {/* ── HEADER ── */}
      <header className="lp-header">
        <div className="lp-logo">
          <img src="/scg-logo.png" alt="SCG Logo" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="lp-logo-text">
            <span className="lp-logo-name">Shabana Consulting</span>
            <span className="lp-logo-sub">SCG · Business Leader Hub</span>
          </div>
        </div>

        <nav className="lp-nav">
          <button className="lp-lang-btn" onClick={toggleLang}>
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>
          <Link to="/services" className="lp-btn-ghost">{c.ctaServices}</Link>
          {user ? (
            <Link to="/dashboard" className="lp-btn-primary">{c.goToDashboard}</Link>
          ) : (
            <>
              <Link to="/login" className="lp-btn-ghost">{c.login}</Link>
              <Link to="/register" className="lp-btn-primary">{c.register}</Link>
            </>
          )}
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-badge">
          <div className="lp-badge-dot" />
          {c.badge}
        </div>

        <h1 style={{ whiteSpace: 'pre-line' }}>{c.heroTitle}</h1>

        <p className="lp-hero-sub">{c.heroSub}</p>

        <div className="lp-hero-cta">
          <button className="lp-btn-primary" onClick={scrollToChat}>{c.ctaChat}</button>
          <button className="lp-btn-ghost"   onClick={scrollToServices}>{c.ctaServices}</button>
        </div>

        <div className="lp-hero-logo">
          <img src="/scg-logo.png" alt="Shabana Consulting Group" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="lp-stats">
        {c.stats.map((s) => (
          <div key={s.num} className="lp-stat">
            <div className="lp-stat-num">{s.num}</div>
            <div className="lp-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── SERVICES ── */}
      <section className="lp-section" id="lp-services">
        <div className="lp-section-label">{c.servicesLabel}</div>
        <h2 className="lp-section-title">{c.servicesTitle}</h2>
        <div className="lp-services-grid">
          {c.services.map((s) => (
            <div key={s.num} className="lp-service-card">
              <div className="lp-service-num">{s.num}</div>
              <div className="lp-service-icon">{s.icon}</div>
              <div className="lp-service-title">{s.title}</div>
              <div className="lp-service-desc">{s.desc}</div>
              <div className="lp-tags">
                {s.tags.map((tag) => <span key={tag} className="lp-tag">{tag}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI CHAT ── */}
      <section className="lp-chat-section" ref={chatSectionRef}>
        <div className="lp-chat-inner">
          <div className="lp-section-label" style={{ textAlign: 'center' }}>{c.chatLabel}</div>
          <h2 className="lp-section-title" style={{ textAlign: 'center', whiteSpace: 'pre-line' }}>
            {c.chatTitle}
          </h2>
          <p style={{ color: 'var(--scg-gray, #8A8A9A)', fontSize: '0.88rem', lineHeight: 1.8 }}>
            {c.chatSub}
          </p>

          <div className="lp-chat-window">
            {/* Header */}
            <div className="lp-chat-header">
              <div className="lp-chat-dot" />
              <span className="lp-chat-title">{c.chatHeaderTitle}</span>
            </div>

            {/* Quick buttons */}
            <div className="lp-quick-btns">
              {c.quickBtns.map((btn) => (
                <button key={btn} className="lp-quick-btn" onClick={() => sendMessage(btn)}>
                  {btn}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="lp-chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`lp-msg ${msg.role === 'user' ? 'lp-msg-user' : 'lp-msg-bot'}`}
                  style={{ whiteSpace: 'pre-line' }}>
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div className="lp-typing">
                  <span /><span /><span />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="lp-chat-input-row">
              <button className="lp-send-btn" onClick={() => sendMessage()} aria-label="Send">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                </svg>
              </button>
              <input
                id="lp-chat-input"
                className="lp-chat-input"
                type="text"
                placeholder={c.chatPlaceholder}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="lp-section">
        <div className="lp-section-label" style={{ textAlign: 'center' }}>{c.whyLabel}</div>
        <h2 className="lp-section-title" style={{ textAlign: 'center' }}>{c.whyTitle}</h2>
        <div className="lp-divider" />
        <div className="lp-why-grid">
          {c.why.map((w) => (
            <div key={w.title} className="lp-why-card">
              <div className="lp-why-icon">{w.icon}</div>
              <div className="lp-why-title">{w.title}</div>
              <div className="lp-why-desc">{w.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <div className="lp-cta-banner">
        <h2>{c.ctaBannerTitle}</h2>
        <p>{c.ctaBannerSub}</p>
        <Link to={user ? '/dashboard' : '/register'} className="lp-btn-primary">
          {user ? c.goToDashboard : c.ctaBannerBtn}
        </Link>
      </div>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-logo">SCG</div>
        <div className="lp-footer-tagline">{c.footerTagline}</div>
        <div className="lp-footer-links">
          {c.footerLinks.map((l) => (
            <Link key={l.to} to={l.to}>{l.label}</Link>
          ))}
        </div>
      </footer>

    </div>
  );
}
