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
  pinterestBoard: 'https://www.pinterest.com/pinterest/official-news-and-updates/', // Default placeholder

  init() {
    auth.onAuthStateChanged(async (user) => {
      this.user = user;
      if (user) {
        await this.loadProfile();
        this.handleRouting();
      } else {
        // Check for Admin Bypass
        if (localStorage.getItem('adminMode') === 'true') {
          this.profile = { groomName: '관리자', brideName: '모드', weddingDate: '2026-12-25', weddingVenue: '테스트 베뉴' };
          this.renderView('dashboard');
          this.nav.style.display = 'block';
        } else {
          this.renderView('auth');
        }
      }
      this.loading.style.display = 'none';
    });

    window.addEventListener('hashchange', () => this.handleRouting());
  },

  handleRouting() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    this.renderView(hash);
  },

  async loadProfile() {
    try {
      const doc = await db.collection('profiles').doc(this.user.uid).get();
      if (doc.exists) {
        this.profile = doc.data();
        this.nav.style.display = 'block';
      } else {
        this.renderView('auth'); // Fallback if no profile
      }
    } catch (e) {
      console.error("Error loading profile", e);
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

    if (!this.isLogin) {
      const confirmPassword = this.shadowRoot.getElementById('confirm-password').value;
      
      // Password Strength Check: 8+ chars and 1+ special char
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      if (password.length < 8 || !hasSpecial) {
        alert('비밀번호는 8자 이상이며 특수문자를 포함해야 합니다.');
        return;
      }

      if (password !== confirmPassword) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
      }
    }

    try {
      if (this.isLogin) {
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Send actual verification link via Firebase
        await user.sendEmailVerification();
        alert('인증 이메일이 발송되었습니다. 메일함을 확인해주세요!');

        // Save profile data
        const profileData = {
          groomName: this.shadowRoot.getElementById('groom-name').value,
          groomBirth: this.shadowRoot.getElementById('groom-birth').value,
          brideName: this.shadowRoot.getElementById('bride-name').value,
          brideBirth: this.shadowRoot.getElementById('bride-birth').value,
          weddingDate: this.shadowRoot.getElementById('wedding-date').value,
          weddingVenue: this.shadowRoot.getElementById('wedding-venue').value,
          referralSource: this.shadowRoot.getElementById('referral-source').value,
          privacyAgreed: this.shadowRoot.getElementById('privacy-agree').checked,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('profiles').doc(user.uid).set(profileData);
      }
    } catch (error) {
      alert(error.message);
    }
  }

  handleAdminBypass() {
    const key = prompt('관리자 마스터 키를 입력하세요:');
    if (key === 'admin123') { // Master Key
      localStorage.setItem('adminMode', 'true');
      App.profile = { groomName: '관리자', brideName: '모드', weddingDate: '2026-12-25', weddingVenue: '테스트 베뉴' };
      App.renderView('dashboard');
      App.nav.style.display = 'block';
    } else {
      alert('잘못된 키입니다.');
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; max-width: 500px; margin: 3rem auto; }
        .auth-card {
          background: white;
          padding: 2.5rem;
          border-radius: 24px;
          box-shadow: var(--shadow-lg);
          border: 1px solid oklch(95% 0.01 340);
        }
        .logo-box { cursor: pointer; user-select: none; margin-bottom: 1.5rem; text-align: center; }
        h2 { font-family: 'Noto Serif KR', serif; text-align: center; color: oklch(25% 0.02 340); margin-bottom: 2rem; }
        .form-group { text-align: left; margin-bottom: 1rem; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .section-title { font-weight: 700; font-size: 0.9rem; color: oklch(60% 0.12 340); margin: 1.5rem 0 0.8rem; border-bottom: 1px solid oklch(95% 0.01 340); padding-bottom: 0.4rem; }
        label { display: block; font-size: 0.85rem; margin-bottom: 0.3rem; color: oklch(55% 0.02 340); }
        input, select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid oklch(90% 0.02 340);
          border-radius: 12px;
          outline: none;
          font-family: inherit;
          background: white;
        }
        input:focus, select:focus { border-color: oklch(85% 0.08 340); }
        .validation-hint { font-size: 0.75rem; margin-top: 0.3rem; color: oklch(55% 0.02 340); }
        
        .checkbox-group {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-top: 1.5rem;
          text-align: left;
        }
        .checkbox-group input { width: auto; margin-top: 0.2rem; }
        .checkbox-group label { font-size: 0.8rem; line-height: 1.4; color: oklch(25% 0.02 340); }
        
        button {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, oklch(85% 0.08 340), oklch(75% 0.05 40));
          color: white;
          border-radius: 12px;
          font-weight: 700;
          margin-top: 2rem;
          cursor: pointer;
          border: none;
        }
        .toggle { margin-top: 1.5rem; text-align: center; font-size: 0.9rem; color: oklch(55% 0.02 340); cursor: pointer; }
        .toggle span { color: oklch(60% 0.12 340); font-weight: 600; }
      </style>
      <div class="auth-card">
        <div class="logo-box" id="logo-bypass">
          <span style="font-size: 2rem;">💍</span>
        </div>
        <h2>${this.isLogin ? '마이 웨딩 북 로그인' : '새로운 시작, 회원가입'}</h2>
        <form id="auth-form">
          <div class="form-group">
            <label>이메일 주소</label>
            <input type="email" id="email" required placeholder="example@email.com">
          </div>
          <div class="form-group">
            <label>비밀번호</label>
            <input type="password" id="password" required placeholder="8자 이상, 특수문자 포함">
            ${!this.isLogin ? '<div class="validation-hint">특수문자(!@#$...)를 1자 이상 포함해주세요.</div>' : ''}
          </div>

          ${!this.isLogin ? `
            <div class="form-group">
              <label>비밀번호 확인</label>
              <input type="password" id="confirm-password" required placeholder="비밀번호를 한번 더 입력하세요">
            </div>

            <div class="section-title">신랑 정보</div>
            <div class="grid-2">
              <div class="form-group">
                <label>신랑 이름</label>
                <input type="text" id="groom-name" required>
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
                <input type="text" id="bride-name" required>
              </div>
              <div class="form-group">
                <label>생년월일</label>
                <input type="date" id="bride-birth" required>
              </div>
            </div>

            <div class="section-title">예식 정보</div>
            <div class="grid-2">
              <div class="form-group">
                <label>예식일</label>
                <input type="date" id="wedding-date" required>
              </div>
              <div class="form-group">
                <label>예식 장소</label>
                <input type="text" id="wedding-venue" required placeholder="예: OO웨딩홀">
              </div>
            </div>

            <div class="section-title">추가 정보</div>
            <div class="form-group">
              <label>알게 된 경로</label>
              <select id="referral-source" required>
                <option value="" disabled selected>선택해주세요</option>
                <option value="instagram">인스타그램</option>
                <option value="blog">블로그/카페</option>
                <option value="friend">지인 추천</option>
                <option value="search">검색 엔진</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div class="checkbox-group">
              <input type="checkbox" id="privacy-agree" required>
              <label for="privacy-agree">
                (필수) 개인정보 수집 및 이용에 동의합니다. <br>
                <span style="color: oklch(55% 0.02 340); font-size: 0.75rem;">입력하신 정보는 오직 웨딩 플래닝 서비스 제공을 위해서만 사용됩니다.</span>
              </label>
            </div>
          ` : ''}

          <button type="submit">${this.isLogin ? '로그인하기' : '인증 메일 발송 및 가입'}</button>
        </form>
        <div class="toggle" id="toggle-mode">
          ${this.isLogin ? '계정이 없으신가요? <span>회원가입</span>' : '이미 계정이 있으신가요? <span>로그인</span>'}
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('auth-form').addEventListener('submit', (e) => this.handleSubmit(e));
    this.shadowRoot.getElementById('toggle-mode').addEventListener('click', () => this.toggleMode());
    this.shadowRoot.getElementById('logo-bypass').addEventListener('dblclick', () => this.handleAdminBypass());
  }
}
customElements.define('wedding-auth', WeddingAuth);

/**
 * Gallery Component (Pinterest + Instagram)
 */
class WeddingGallery extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.instagramLinks = [];
  }

  async connectedCallback() {
    await this.loadInstagramLinks();
    this.render();
  }

  async loadInstagramLinks() {
    const snapshot = await db.collection('profiles').doc(App.user.uid).collection('gallery').orderBy('createdAt', 'desc').get();
    this.instagramLinks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async addInstagramLink(e) {
    e.preventDefault();
    const url = this.shadowRoot.getElementById('insta-url').value;
    const category = this.shadowRoot.getElementById('insta-category').value;
    
    if (!url.includes('instagram.com')) {
      alert('올바른 인스타그램 주소를 입력해주세요.');
      return;
    }

    try {
      await db.collection('profiles').doc(App.user.uid).collection('gallery').add({
        url,
        category,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      this.shadowRoot.getElementById('insta-url').value = '';
      await this.loadInstagramLinks();
      this.render();
    } catch (e) {
      alert('저장에 실패했습니다.');
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; padding: 2rem 0; }
        h2 { font-family: 'Noto Serif KR', serif; color: oklch(25% 0.02 340); margin-bottom: 2rem; }
        .section { background: white; padding: 2rem; border-radius: 24px; border: 1px solid oklch(95% 0.01 340); margin-bottom: 2rem; }
        .section-title { font-weight: 700; font-size: 1.2rem; color: oklch(60% 0.12 340); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; }
        
        .insta-form { display: flex; gap: 0.5rem; margin-bottom: 2rem; }
        input, select { padding: 0.7rem; border: 1px solid oklch(90% 0.02 340); border-radius: 10px; outline: none; }
        input { flex: 1; }
        button.add-btn { background: var(--accent-color); color: white; border: none; padding: 0 1.5rem; border-radius: 10px; font-weight: 600; cursor: pointer; }
        
        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
        .insta-card { background: oklch(98% 0.01 340); border-radius: 12px; padding: 1rem; text-align: center; border: 1px solid oklch(95% 0.01 340); }
        .insta-card a { color: oklch(60% 0.12 340); font-weight: 600; font-size: 0.9rem; }
        .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 50px; background: white; font-size: 0.75rem; margin-bottom: 0.5rem; border: 1px solid oklch(90% 0.02 340); }

        .pin-container { display: flex; justify-content: center; overflow: hidden; border-radius: 16px; }
      </style>
      
      <div class="fade-in">
        <h2>✨ 우리의 웨딩 영감</h2>

        <div class="section">
          <div class="section-title">📌 핀터레스트 보드</div>
          <p style="font-size: 0.9rem; color: #777; margin-bottom: 1.5rem;">핀터레스트 앱에서 저장한 이미지가 실시간으로 업데이트됩니다.</p>
          <div class="pin-container">
            <!-- Pinterest Board Widget -->
            <a data-pin-do="embedBoard" 
               data-pin-board-width="900" 
               data-pin-scale-height="400" 
               data-pin-scale-width="150" 
               href="${App.pinterestBoard}">
            </a>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📸 인스타그램 스크랩</div>
          <form class="insta-form" id="insta-form">
            <select id="insta-category">
              <option value="드레스">드레스</option>
              <option value="메이크업">메이크업</option>
              <option value="네일">네일</option>
              <option value="기타">기타</option>
            </select>
            <input type="text" id="insta-url" placeholder="인스타그램 게시물 링크를 붙여넣으세요" required>
            <button type="submit" class="add-btn">저장</button>
          </form>

          <div class="gallery-grid">
            ${this.instagramLinks.map(link => `
              <div class="insta-card">
                <span class="badge">${link.category}</span><br>
                <a href="${link.url}" target="_blank">게시물 보기 ↗</a>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('insta-form')?.addEventListener('submit', (e) => this.addInstagramLink(e));
    
    // Re-initialize Pinterest widgets
    if (window.PinUtils) {
      window.PinUtils.build();
    }
  }
}
customElements.define('wedding-gallery', WeddingGallery);

/**
 * Checklist Component
 */
class WeddingChecklist extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.tasks = [];
    this.defaultTasks = [
      { text: '상견례 장소 예약 및 진행', completed: false, category: '준비' },
      { text: '웨딩홀 투어 및 계약', completed: false, category: '준비' },
      { text: '스드메(스튜디오, 드레스, 메이크업) 계약', completed: false, category: '예약' },
      { text: '본식 스냅 및 영상 예약', completed: false, category: '예약' },
      { text: '신혼여행지 결정 및 항공권 예약', completed: false, category: '예약' },
      { text: '예물/예단 상의 및 결정', completed: false, category: '물품' },
      { text: '한복 대여 또는 맞춤', completed: false, category: '물품' },
      { text: '청첩장 디자인 선택 및 인쇄', completed: false, category: '알림' }
    ];
  }

  async connectedCallback() {
    await this.loadTasks();
    this.render();
  }

  async loadTasks() {
    const snapshot = await db.collection('profiles').doc(App.user.uid).collection('tasks').orderBy('createdAt', 'asc').get();
    if (snapshot.empty) {
      // Initialize with default tasks if empty
      for (const task of this.defaultTasks) {
        await db.collection('profiles').doc(App.user.uid).collection('tasks').add({
          ...task,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      await this.loadTasks(); // Reload
    } else {
      this.tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  }

  async toggleTask(id, completed) {
    await db.collection('profiles').doc(App.user.uid).collection('tasks').doc(id).update({
      completed: !completed
    });
    await this.loadTasks();
    this.render();
  }

  async addTask(e) {
    e.preventDefault();
    const input = this.shadowRoot.getElementById('new-task-input');
    const text = input.value.trim();
    if (!text) return;

    await db.collection('profiles').doc(App.user.uid).collection('tasks').add({
      text,
      completed: false,
      category: '커스텀',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    input.value = '';
    await this.loadTasks();
    this.render();
  }

  async deleteTask(id) {
    if (!confirm('이 항목을 삭제할까요?')) return;
    await db.collection('profiles').doc(App.user.uid).collection('tasks').doc(id).delete();
    await this.loadTasks();
    this.render();
  }

  render() {
    const completedCount = this.tasks.filter(t => t.completed).length;
    const progress = Math.round((completedCount / this.tasks.length) * 100) || 0;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; padding: 2rem 0; }
        .checklist-container { background: white; padding: 2.5rem; border-radius: 24px; border: 1px solid oklch(95% 0.01 340); box-shadow: var(--shadow-md); }
        h2 { font-family: 'Noto Serif KR', serif; color: oklch(25% 0.02 340); margin-bottom: 1rem; }
        
        .progress-section { margin-bottom: 2rem; }
        .progress-bar { height: 10px; background: oklch(95% 0.01 340); border-radius: 5px; overflow: hidden; margin: 0.5rem 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, oklch(85% 0.08 340), oklch(75% 0.05 40)); width: ${progress}%; transition: width 0.5s ease; }
        .progress-text { font-size: 0.9rem; color: oklch(55% 0.02 340); }

        .add-task-form { display: flex; gap: 0.5rem; margin-bottom: 2rem; }
        input { flex: 1; padding: 0.8rem; border: 1px solid oklch(90% 0.02 340); border-radius: 12px; outline: none; }
        button.add-btn { background: oklch(60% 0.12 340); color: white; border: none; padding: 0 1.5rem; border-radius: 12px; font-weight: 600; cursor: pointer; }

        .task-list { display: flex; flex-direction: column; gap: 0.8rem; }
        .task-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 12px; background: oklch(98% 0.01 340); border: 1px solid oklch(95% 0.01 340); transition: 0.2s; }
        .task-item.completed { opacity: 0.6; background: #f9f9f9; }
        .task-item.completed .task-text { text-decoration: line-through; color: #aaa; }
        
        .checkbox { width: 22px; height: 22px; border-radius: 6px; border: 2px solid oklch(85% 0.08 340); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .checkbox.checked { background: oklch(85% 0.08 340); }
        .checkbox.checked::after { content: '✓'; color: white; font-size: 0.8rem; }
        
        .task-text { flex: 1; font-size: 1rem; color: var(--text-main); }
        .category-badge { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; background: white; color: oklch(55% 0.02 340); border: 1px solid oklch(90% 0.02 340); }
        
        .delete-btn { color: #ff9999; cursor: pointer; font-size: 0.9rem; padding: 0.5rem; opacity: 0; transition: 0.2s; }
        .task-item:hover .delete-btn { opacity: 1; }
      </style>
      
      <div class="fade-in">
        <h2>📝 체크리스트</h2>
        <div class="checklist-container">
          <div class="progress-section">
            <div class="flex justify-between">
              <span class="progress-text">완료된 항목: ${completedCount} / ${this.tasks.length}</span>
              <span class="progress-text">${progress}%</span>
            </div>
            <div class="progress-bar"><div class="progress-fill"></div></div>
          </div>

          <form class="add-task-form" id="add-task-form">
            <input type="text" id="new-task-input" placeholder="새로운 할 일을 추가하세요" required>
            <button type="submit" class="add-btn">추가</button>
          </form>

          <div class="task-list">
            ${this.tasks.map(task => `
              <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="checkbox ${task.completed ? 'checked' : ''}" 
                     onclick="this.getRootNode().host.toggleTask('${task.id}', ${task.completed})">
                </div>
                <div class="task-text" onclick="this.getRootNode().host.toggleTask('${task.id}', ${task.completed})">
                  ${task.text}
                </div>
                <span class="category-badge">${task.category}</span>
                <span class="delete-btn" onclick="this.getRootNode().host.deleteTask('${task.id}')">✕</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('add-task-form')?.addEventListener('submit', (e) => this.addTask(e));
  }
}
customElements.define('wedding-checklist', WeddingChecklist);

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
    localStorage.removeItem('adminMode');
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
    this.stats = { tasks: { total: 0, completed: 0 } };
  }

  async connectedCallback() {
    await this.loadStats();
    this.render();
  }

  async loadStats() {
    if (!App.user) return;
    const tasksSnapshot = await db.collection('profiles').doc(App.user.uid).collection('tasks').get();
    this.stats.tasks.total = tasksSnapshot.size;
    this.stats.tasks.completed = tasksSnapshot.docs.filter(d => d.data().completed).length;
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
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); border-color: var(--primary-color); }
        .title { font-weight: 700; font-size: 1.1rem; margin-bottom: 1rem; display: block; }
        .stat { font-size: 2rem; font-weight: 700; color: oklch(60% 0.12 340); }
      </style>
      
      <div class="hero">
        <div class="d-day-badge">${dDayText}</div>
        <h1>${profile.groomName || '신랑'} ❤️ ${profile.brideName || '신부'}</h1>
        <p class="venue">${profile.weddingDate || '예식일'} | ${profile.weddingVenue || '예식장'}</p>
      </div>

      <div class="grid">
        <a href="#checklist" class="card">
          <span class="title">📝 체크리스트</span>
          <div class="stat">${this.stats.tasks.completed} / ${this.stats.tasks.total}</div>
          <p style="margin-top: 0.5rem; color: #777;">${this.stats.tasks.total > 0 ? '순조롭게 진행 중입니다!' : '항목을 추가해주세요'}</p>
        </a>
        <a href="#budget" class="card">
          <span class="title">💰 예산 현황</span>
          <div class="stat">₩ 12,450,000</div>
          <p style="margin-top: 0.5rem; color: #777;">총 예산의 62% 집행</p>
        </a>
        <a href="#gallery" class="card">
          <span class="title">✨ 영감 갤러리</span>
          <div class="stat">P + I</div>
          <p style="margin-top: 0.5rem; color: #777;">핀터레스트 & 인스타그램 통합</p>
        </a>
      </div>
    `;
  }
}
customElements.define('wedding-dashboard', WeddingDashboard);

// Start App
App.init();
