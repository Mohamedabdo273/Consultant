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
        num: '01', icon: '🏗️',
        title: 'تأسيس مكاتب إدارة المشاريع الذكية',
        desc: 'تصميم وهيكلة مكاتب PMO من الصفر مع دمج الذكاء الاصطناعي لأتمتة التقارير، جدولة المهام، والتنبؤ بمواعيد التسليم بدقة فائقة.',
        tags: ['AI-Driven PMO', 'تحكم بالتكاليف', 'تأسيس'],
      },
      {
        num: '02', icon: '💡',
        title: 'استشارات التحول الرقمي والذكاء الاصطناعي',
        desc: 'تحليل النظم القائمة وتطويرها رقمياً، وبناء لوحات بيانات تفاعلية للمديرين لمتابعة الأداء لحظياً مع حلول برمجية مخصصة.',
        tags: ['Dashboards', 'تحول رقمي', 'برمجيات'],
      },
      {
        num: '03', icon: '🎓',
        title: 'أكاديمية القادة',
        desc: 'معسكرات تدريبية مكثفة للمهندسين ومديري المشاريع، ببرامج متخصصة في إدارة المشاريع بالذكاء الاصطناعي والمهارات القيادية الحديثة.',
        tags: ['Bootcamps', 'قيادة', 'تدريب'],
      },
      {
        num: '04', icon: '📈',
        title: 'إدارة الأصول والاستثمارات الذكية',
        desc: 'استشارات استثمارية للمستثمرين في الوحدات التجارية والإدارية، مع إدارة وتشغيل الأصول لضمان أعلى عوائد باستخدام أنظمة المرافق الذكية.',
        tags: ['Smart Assets', 'استثمار', 'عقارات'],
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
        num: '01', icon: '🏗️',
        title: 'AI-Driven PMO Setup',
        desc: 'Design and structure PMOs from scratch, integrating AI to automate reports, schedule tasks, and predict delivery dates with exceptional accuracy.',
        tags: ['AI-Driven PMO', 'Cost Control', 'Setup'],
      },
      {
        num: '02', icon: '💡',
        title: 'Digital Transformation & AI Consulting',
        desc: 'Analyze and upgrade existing systems digitally, building interactive dashboards for managers to monitor performance in real-time with custom software solutions.',
        tags: ['Dashboards', 'Digital Transformation', 'Software'],
      },
      {
        num: '03', icon: '🎓',
        title: 'Leaders Academy',
        desc: 'Intensive training bootcamps for engineers and project managers, with specialized programs in AI-driven project management and modern leadership skills.',
        tags: ['Bootcamps', 'Leadership', 'Training'],
      },
      {
        num: '04', icon: '📈',
        title: 'Smart Asset & Investment Management',
        desc: 'Investment consulting for investors in commercial units, with asset management and operation to ensure the highest returns using smart utility systems.',
        tags: ['Smart Assets', 'Investment', 'Real Estate'],
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
    services: '✅ نقدم 4 خدمات رئيسية:\n1. تأسيس مكاتب PMO الذكية\n2. استشارات التحول الرقمي\n3. أكاديمية القادة (Bootcamps)\n4. إدارة الأصول والاستثمارات\n\nأي خدمة تريد معرفة المزيد عنها؟',
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

  // Scroll-reveal for cards
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.lp-service-card, .lp-why-card').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

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
