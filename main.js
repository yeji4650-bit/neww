/**
 * My Wedding Book - Core Logic
 */

// --- Firebase Configuration (Placeholder) ---
const firebaseConfig = {
  apiKey: "placeholder-api-key",
  authDomain: "my-wedding-book.firebaseapp.com",
  projectId: "my-wedding-book",
  storageBucket: "my-wedding-book.appspot.com",
  messagingSenderId: "placeholder",
  appId: "placeholder"
};

// Initialize Firebase
let auth, db;
try {
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
  console.log("Firebase initialized");
} catch (e) {
  console.warn("Firebase initialization failed.", e);
}

// --- App State Management ---
const App = {
  user: null,
  profile: null,
  root: document.getElementById('app-root'),
  nav: document.getElementById('main-nav'),
  loading: document.getElementById('loading-screen'),

  init() {
    auth.onAuthStateChanged(async (user) => {
      this.user = user;
      if (user) {
        await this.loadProfile();
      } else {
        this.renderView('auth');
      }
      this.loading.style.display = 'none';
    });
  },

  async loadProfile() {
    try {
      const doc = await db.collection('profiles').doc(this.user.uid).get();
      if (doc.exists) {
        this.profile = doc.data();
        this.renderView('dashboard');
        this.nav.style.display = 'block';
      } else {
        this.renderView('onboarding');
        this.nav.style.display = 'none';
      }
    } catch (e) {
      console.error("Error loading profile", e);
      this.renderView('onboarding');
    }
  },

  renderView(view) {
    this.root.innerHTML = '';
    const el = document.createElement(`wedding-${view}`);
    this.root.appendChild(el);
    
    // Smooth transition
    this.root.classList.remove('fade-in');
    void this.root.offsetWidth; // trigger reflow
    this.root.classList.add('fade-in');
  }
};

// --- Web Components ---

/**
 * Authentication Component (Login/Signup)
 */
class WeddingAuth extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isLogin = true;
  }

  connectedCallback() {
    this.render();
  }

  toggleMode() {
    this.isLogin = !this.isLogin;
    this.render();
  }

  async handleSubmit(e) {
    e.preventDefault();
    const email = this.shadowRoot.getElementById('email').value;
    const password = this.shadowRoot.getElementById('password').value;

    try {
      if (this.isLogin) {
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        await auth.createUserWithEmailAndPassword(email, password);
      }
    } catch (error) {
      alert(error.message);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; max-width: 400px; margin: 4rem auto; }
        .auth-card {
          background: white;
          padding: 2.5rem;
          border-radius: 24px;
          box-shadow: var(--shadow-lg);
          border: 1px solid oklch(95% 0.01 340);
          text-align: center;
        }
        h2 { font-family: 'Noto Serif KR', serif; color: oklch(25% 0.02 340); margin-bottom: 1.5rem; }
        .form-group { text-align: left; margin-bottom: 1rem; }
        label { display: block; font-size: 0.9rem; margin-bottom: 0.4rem; color: oklch(55% 0.02 340); }
        input {
          width: 100%;
          padding: 0.8rem;
          border: 1px solid oklch(90% 0.02 340);
          border-radius: 12px;
          outline: none;
          transition: border 0.2s;
        }
        input:focus { border-color: oklch(85% 0.08 340); }
        button {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, oklch(85% 0.08 340), oklch(75% 0.05 40));
          color: white;
          border-radius: 12px;
          font-weight: 700;
          margin-top: 1.5rem;
          box-shadow: var(--shadow-glow);
        }
        .toggle { margin-top: 1.5rem; font-size: 0.9rem; color: oklch(55% 0.02 340); cursor: pointer; }
        .toggle span { color: oklch(60% 0.12 340); font-weight: 600; }
      </style>
      <div class="auth-card">
        <h2>${this.isLogin ? '반가워요!' : '환영합니다!'}</h2>
        <form id="auth-form">
          <div class="form-group">
            <label>이메일</label>
            <input type="email" id="email" required placeholder="example@email.com">
          </div>
          <div class="form-group">
            <label>비밀번호</label>
            <input type="password" id="password" required placeholder="••••••••">
          </div>
          <button type="submit">${this.isLogin ? '로그인' : '회원가입'}</button>
        </form>
        <div class="toggle" id="toggle-mode">
          ${this.isLogin ? '계정이 없으신가요? <span>회원가입</span>' : '이미 계정이 있으신가요? <span>로그인</span>'}
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('auth-form').addEventListener('submit', (e) => this.handleSubmit(e));
    this.shadowRoot.getElementById('toggle-mode').addEventListener('click', () => this.toggleMode());
  }
}
customElements.define('wedding-auth', WeddingAuth);

/**
 * Onboarding Component (Profile Setup)
 */
class WeddingOnboarding extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  async handleSubmit(e) {
    e.preventDefault();
    const data = {
      groomName: this.shadowRoot.getElementById('groom-name').value,
      groomBirth: this.shadowRoot.getElementById('groom-birth').value,
      brideName: this.shadowRoot.getElementById('bride-name').value,
      brideBirth: this.shadowRoot.getElementById('bride-birth').value,
      weddingDate: this.shadowRoot.getElementById('wedding-date').value,
      weddingVenue: this.shadowRoot.getElementById('wedding-venue').value,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      await db.collection('profiles').doc(App.user.uid).set(data);
      App.loadProfile(); // Refresh app state
    } catch (error) {
      alert(error.message);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; max-width: 550px; margin: 3rem auto; }
        .form-card {
          background: white;
          padding: 2.5rem;
          border-radius: 24px;
          box-shadow: var(--shadow-lg);
          border: 1px solid oklch(95% 0.01 340);
        }
        h2 { font-family: 'Noto Serif KR', serif; text-align: center; color: oklch(25% 0.02 340); margin-bottom: 2rem; }
        .section-title { font-weight: 700; font-size: 1rem; color: oklch(60% 0.12 340); margin: 1.5rem 0 0.8rem; border-bottom: 1px solid oklch(95% 0.01 340); padding-bottom: 0.5rem; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; font-size: 0.85rem; margin-bottom: 0.3rem; color: oklch(55% 0.02 340); }
        input {
          width: 100%;
          padding: 0.7rem;
          border: 1px solid oklch(90% 0.02 340);
          border-radius: 10px;
          outline: none;
          font-family: inherit;
        }
        input:focus { border-color: oklch(85% 0.08 340); }
        button {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, oklch(85% 0.08 340), oklch(75% 0.05 40));
          color: white;
          border-radius: 12px;
          font-weight: 700;
          margin-top: 2rem;
          border: none;
          cursor: pointer;
        }
      </style>
      <div class="form-card">
        <h2>우리의 결혼 정보 입력</h2>
        <form id="onboarding-form">
          
          <div class="section-title">신랑 정보</div>
          <div class="grid-2">
            <div class="form-group">
              <label>신랑 이름</label>
              <input type="text" id="groom-name" required placeholder="이름">
            </div>
            <div class="form-group">
              <label>생년월일</label>
              <input type="date" id="groom-birth" required>
            </div>
          </div>

          <div class="section-title">신부 정보</div>
          <div class="grid-2">
            <div class="form-group">
              <label>신부 이름</label>
              <input type="text" id="bride-name" required placeholder="이름">
            </div>
            <div class="form-group">
              <label>생년월일</label>
              <input type="date" id="bride-birth" required>
            </div>
          </div>

          <div class="section-title">예식 정보</div>
          <div class="form-group">
            <label>예식일</label>
            <input type="date" id="wedding-date" required>
          </div>
          <div class="form-group">
            <label>식장 이름</label>
            <input type="text" id="wedding-venue" required placeholder="OO 웨딩홀">
          </div>
          
          <button type="submit">마이 웨딩 북 시작하기</button>
        </form>
      </div>
    `;
    this.shadowRoot.getElementById('onboarding-form').addEventListener('submit', (e) => this.handleSubmit(e));
  }
}
customElements.define('wedding-onboarding', WeddingOnboarding);

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
  }

  async handleLogout() {
    await auth.signOut();
    location.reload();
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
          gap: 1.5rem;
          font-weight: 500;
          color: oklch(25% 0.02 340);
          align-items: center;
        }
        .nav-links a {
          text-decoration: none;
          color: inherit;
          font-size: 0.95rem;
          transition: color 0.2s ease;
        }
        .logout-btn {
          font-size: 0.85rem;
          color: oklch(55% 0.02 340);
          padding: 0.4rem 0.8rem;
          border: 1px solid oklch(90% 0.02 340);
          border-radius: 8px;
        }
        @media (max-width: 768px) {
          .nav-links a:not(.logout-btn) { display: none; }
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
          <button class="logout-btn" id="logout-btn">로그아웃</button>
        </div>
      </nav>
    `;
    this.shadowRoot.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
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
  }

  connectedCallback() {
    this.render();
  }

  calculateDDay() {
    if (!App.profile?.weddingDate) return null;
    const target = new Date(App.profile.weddingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  render() {
    const profile = App.profile || {};
    const dDay = this.calculateDDay();
    const dDayText = dDay === null ? 'D-Day' : (dDay === 0 ? '오늘이 예식일입니다! 🎉' : `D-${dDay}`);
    
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
        }
        .d-day-badge {
          display: inline-block;
          background: linear-gradient(135deg, oklch(85% 0.08 340), oklch(75% 0.05 40));
          color: white;
          padding: 0.5rem 1.5rem;
          border-radius: 50px;
          font-weight: 700;
          font-size: 1.2rem;
          margin-bottom: 1rem;
        }
        h1 {
          font-family: 'Noto Serif KR', serif;
          font-size: 2.2rem;
          color: oklch(25% 0.02 340);
          margin-bottom: 0.8rem;
        }
        .venue { color: oklch(55% 0.02 340); font-size: 1.1rem; }
        
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
          transition: all 0.3s;
        }
        .title { font-weight: 700; font-size: 1.1rem; margin-bottom: 1rem; display: block; }
        .stat { font-size: 2rem; font-weight: 700; color: oklch(60% 0.12 340); }
      </style>
      
      <div class="hero">
        <div class="d-day-badge">${dDayText}</div>
        <h1>${profile.groomName || '신랑'} ❤️ ${profile.brideName || '신부'}</h1>
        <p class="venue">${profile.weddingDate} | ${profile.weddingVenue}</p>
      </div>

      <div class="grid">
        <div class="card">
          <span class="title">📝 체크리스트</span>
          <div class="stat">12 / 48</div>
          <p style="margin-top: 0.5rem; color: #777;">순조롭게 진행 중입니다!</p>
        </div>
        <div class="card">
          <span class="title">💰 예산 현황</span>
          <div class="stat">₩ 12,450,000</div>
          <p style="margin-top: 0.5rem; color: #777;">총 예산의 62% 집행</p>
        </div>
        <div class="card">
          <span class="title">✨ 저장된 영감</span>
          <div class="stat">85</div>
          <p style="margin-top: 0.5rem; color: #777;">드레스 24, 메이크업 12...</p>
        </div>
      </div>
    `;
  }
}
customElements.define('wedding-dashboard', WeddingDashboard);

// Start App
App.init();
