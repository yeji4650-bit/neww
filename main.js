/**
 * My Wedding Book - Core Logic
 */

// --- Firebase Configuration (Placeholder) ---
// Note: In a real app, these would be provided by the environment.
const firebaseConfig = {
  apiKey: "placeholder-api-key",
  authDomain: "my-wedding-book.firebaseapp.com",
  projectId: "my-wedding-book",
  storageBucket: "my-wedding-book.appspot.com",
  messagingSenderId: "placeholder",
  appId: "placeholder"
};

// Initialize Firebase (wrapped in try-catch for local dev without config)
try {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized");
} catch (e) {
  console.warn("Firebase initialization failed. Check your config.", e);
}

// --- Web Components ---

/**
 * Navigation Bar Component
 */
class WeddingNav extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    lucide.createIcons(); // Note: This won't work inside shadow DOM directly without script tag in shadow
    // We'll use SVG strings for reliability in shadow DOM
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: sticky;
          top: 0;
          z-index: 1000;
          background: rgba(250, 245, 245, 0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid oklch(90% 0.02 340);
        }
        nav {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          font-family: 'Noto Serif KR', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: oklch(60% 0.12 340);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .nav-links {
          display: flex;
          gap: 2rem;
          font-weight: 500;
          color: oklch(25% 0.02 340);
        }
        .nav-links a {
          text-decoration: none;
          color: inherit;
          font-size: 0.95rem;
          transition: color 0.2s ease;
        }
        .nav-links a:hover {
          color: oklch(85% 0.08 340);
        }
        @media (max-width: 768px) {
          .nav-links { display: none; }
        }
      </style>
      <nav>
        <div class="logo">
          <span>💍</span> My Wedding Book
        </div>
        <div class="nav-links">
          <a href="#dashboard">홈</a>
          <a href="#checklist">체크리스트</a>
          <a href="#budget">예산 관리</a>
          <a href="#gallery">영감 갤러리</a>
        </div>
      </nav>
    `;
  }
}
customElements.define('wedding-nav', WeddingNav);

/**
 * Dashboard Component
 */
class WeddingDashboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.weddingDate = localStorage.getItem('weddingDate') || null;
  }

  connectedCallback() {
    this.render();
  }

  calculateDDay() {
    if (!this.weddingDate) return null;
    const target = new Date(this.weddingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  handleDateChange(e) {
    const newDate = e.target.value;
    localStorage.setItem('weddingDate', newDate);
    this.weddingDate = newDate;
    this.render();
  }

  render() {
    const dDay = this.calculateDDay();
    const dDayText = dDay === null ? '날짜를 설정해주세요' : (dDay === 0 ? 'D-Day' : `D-${dDay}`);
    
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; padding: 2rem 0; }
        .hero {
          text-align: center;
          margin-bottom: 3rem;
          background: white;
          padding: 3rem 1.5rem;
          border-radius: 30px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          border: 1px solid oklch(95% 0.01 340);
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content: '❤';
          position: absolute;
          top: -20px;
          right: -20px;
          font-size: 10rem;
          color: oklch(95% 0.03 340);
          opacity: 0.5;
          z-index: 0;
        }
        .hero-content { position: relative; z-index: 1; }
        
        .d-day-badge {
          display: inline-block;
          background: linear-gradient(135deg, oklch(85% 0.08 340), oklch(75% 0.05 40));
          color: white;
          padding: 0.5rem 1.5rem;
          border-radius: 50px;
          font-weight: 700;
          font-size: 1.2rem;
          margin-bottom: 1rem;
          box-shadow: 0 4px 15px oklch(85% 0.1 340 / 30%);
        }
        
        h1 {
          font-family: 'Noto Serif KR', serif;
          font-size: 2.5rem;
          color: oklch(25% 0.02 340);
          margin-bottom: 0.5rem;
        }
        p { color: oklch(55% 0.02 340); font-size: 1.1rem; }
        
        .date-picker-container {
          margin-top: 1.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
        }
        input[type="date"] {
          border: 1px solid oklch(90% 0.02 340);
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          font-family: inherit;
          color: var(--text-main);
          outline: none;
        }
        input[type="date"]:focus {
          border-color: oklch(85% 0.08 340);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        
        .card {
          background: white;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border: 1px solid oklch(95% 0.01 340);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08);
          border-color: oklch(85% 0.08 340);
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .icon {
          font-size: 1.5rem;
          background: oklch(95% 0.03 340);
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }
        .title { font-weight: 700; font-size: 1.2rem; }
        .stat { font-size: 2rem; font-weight: 700; margin: 1rem 0; color: oklch(60% 0.12 340); }
        .progress-bar {
          height: 8px;
          background: oklch(95% 0.01 340);
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, oklch(85% 0.08 340), oklch(75% 0.05 40));
          width: 45%; /* Example */
        }
      </style>
      
      <div class="hero">
        <div class="hero-content">
          <div class="d-day-badge">${dDayText}</div>
          <h1>우리의 특별한 날을 위하여</h1>
          <p>함께 준비하는 설레는 결혼 준비의 시작</p>
          
          <div class="date-picker-container">
            <label style="font-size: 0.9rem; color: oklch(55% 0.02 340);">예식일 설정:</label>
            <input type="date" value="${this.weddingDate || ''}" id="wedding-date-input">
          </div>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-header">
            <span class="title">결혼 체크리스트</span>
            <span class="icon">📝</span>
          </div>
          <div class="stat">12 / 48</div>
          <p>남은 할 일: 36개</p>
          <div class="progress-bar"><div class="progress-fill"></div></div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="title">예산 관리</span>
            <span class="icon">💰</span>
          </div>
          <div class="stat">₩ 12,450,000</div>
          <p>예산 집행률: 62%</p>
          <div class="progress-bar"><div class="progress-fill" style="width: 62%"></div></div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="title">영감 갤러리</span>
            <span class="icon">✨</span>
          </div>
          <div class="stat">85 Items</div>
          <p>최근 저장: 웨딩 드레스 스타일</p>
          <div style="display: flex; gap: 4px; margin-top: 1rem;">
            <div style="width: 40px; height: 40px; border-radius: 4px; background: #eee;"></div>
            <div style="width: 40px; height: 40px; border-radius: 4px; background: #ddd;"></div>
            <div style="width: 40px; height: 40px; border-radius: 4px; background: #ccc;"></div>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('wedding-date-input').addEventListener('change', (e) => this.handleDateChange(e));
  }
}
customElements.define('wedding-dashboard', WeddingDashboard);
