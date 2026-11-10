(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const themeButtons = [...document.querySelectorAll('.theme-toggle')];
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('harrison-theme-cinematic') || 'dark'; } catch {}
  const applyTheme = theme => {
    document.documentElement.dataset.theme = theme;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === 'dark' ? '#08080c' : '#f3f0f6';
    themeButtons.forEach(button => {
      const next = theme === 'dark' ? 'light' : 'dark';
      button.setAttribute('aria-label', `Switch to ${next} theme`);
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.querySelector('span').textContent = theme === 'dark' ? '☼' : '◐';
    });
    try { localStorage.setItem('harrison-theme-cinematic', theme); } catch {}
    dispatchEvent(new CustomEvent('portfolio-theme-change', { detail: { theme } }));
  };
  applyTheme(savedTheme === 'dark' ? 'dark' : 'light');
  themeButtons.forEach(button => button.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')));

  const preloader = document.querySelector('.site-preloader');
  if (preloader) {
    const count = preloader.querySelector('[data-loader-count]');
    const fill = preloader.querySelector('[data-loader-fill]');
    const bar = preloader.querySelector('[role="progressbar"]');
    const status = preloader.querySelector('[data-loader-status]');
    const duration = reduced ? 120 : 1600;
    let start = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (count) count.textContent = '100';
      if (fill) fill.style.transform = 'scaleX(1)';
      bar?.setAttribute('aria-valuenow', '100');
      if (status) status.textContent = 'WELCOME';
      preloader.classList.add('is-ready');
      setTimeout(() => {
        preloader.classList.add('is-leaving');
        document.body.classList.remove('is-loading');
        document.body.removeAttribute('aria-busy');
        setTimeout(() => preloader.remove(), reduced ? 0 : 560);
      }, reduced ? 0 : 180);
    };
    const tick = now => {
      if (done) return;
      if (!start) start = now;
      const linear = Math.min(1, (now - start) / duration);
      const progress = 1 - Math.pow(1 - linear, 3);
      const value = Math.round(progress * 100);
      if (count) count.textContent = String(value).padStart(3, '0');
      if (fill) fill.style.transform = `scaleX(${progress})`;
      bar?.setAttribute('aria-valuenow', String(value));
      if (linear >= 1) finish();
      else requestAnimationFrame(tick);
    };
    document.body.setAttribute('aria-busy', 'true');
    requestAnimationFrame(tick);
    preloader.querySelector('[data-loader-skip]')?.addEventListener('click', finish);
    preloader.addEventListener('click', event => {
      if (event.target === preloader) finish();
    });
  }

  const menu = document.querySelector('.menu-toggle');
  const menuClose = document.querySelector('.menu-close');
  const nav = document.querySelector('.main-nav');
  if (menu && nav) {
    const header = menu.closest('.site-header');
    const setMenuOpen = open => {
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('open', open);
      header?.classList.toggle('menu-open', open);
      document.documentElement.classList.toggle('nav-locked', open);
      document.body.classList.toggle('nav-locked', open);
      if (open) requestAnimationFrame(() => nav.querySelector('a')?.focus({ preventScroll: true }));
    };
    menu.addEventListener('click', () => {
      setMenuOpen(menu.getAttribute('aria-expanded') !== 'true');
    });
    menuClose?.addEventListener('click', () => {
      setMenuOpen(false);
      menu.focus({ preventScroll: true });
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      setMenuOpen(false);
    }));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false);
        menu.focus({ preventScroll: true });
      }
    });
    addEventListener('resize', () => {
      if (innerWidth > 1000 && menu.getAttribute('aria-expanded') === 'true') setMenuOpen(false);
    }, { passive: true });
  }

  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  const progress = document.querySelector('.progress-bar');
  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max > 0 ? scrollY / max * 100 : 0}%`;
  };
  addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  document.querySelectorAll('[data-parallax]').forEach(el => {
    if (reduced || matchMedia('(pointer: coarse)').matches) return;
    el.addEventListener('pointermove', event => {
      const box = el.getBoundingClientRect();
      const rx = (event.clientX - box.left) / box.width - .5;
      const ry = (event.clientY - box.top) / box.height - .5;
      el.style.setProperty('--tilt-x', `${ry * -2}deg`);
      el.style.setProperty('--tilt-y', `${rx * 2}deg`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
    });
  });

  document.querySelectorAll('.study-controls button').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.study-controls button').forEach(item => item.classList.toggle('selected', item === button));
    document.querySelector('.study-grid')?.classList.toggle('mobile-view', button.dataset.view === 'mobile');
  }));

  document.querySelectorAll('.service-item>button').forEach(button => button.addEventListener('click', () => {
    const item = button.closest('.service-item');
    const description = item.querySelector('.service-description');
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    button.querySelector('i').textContent = open ? '−' : '+';
    description.hidden = !open;
  }));

  const toolData = {
    engineering: ['SOFTWARE ENGINEERING', 'Start with', 'the question.', 'A clear problem statement is a better starting point than a favorite framework. I’m interested in sound architecture, practical software, and keeping the real user need in view.'],
    frontend: ['FRONTEND & INTERACTION', 'Make it', 'feel clear.', 'Interfaces bring product intent and engineering together. I explore how structure, visual hierarchy, and small motion cues can make an experience easier to use.'],
    backend: ['BACKEND SYSTEMS', 'Build on', 'solid ground.', 'Services, data, and system boundaries support the product experience. The right design depends on the product’s needs and constraints.'],
    ai: ['ARTIFICIAL INTELLIGENCE', 'Useful', 'intelligence.', 'I’m interested in intelligent systems that help people reason, create, or act. A good application begins with a real use case and careful attention to its limits.'],
    data: ['DATA & INFRASTRUCTURE', 'Make the', 'system dependable.', 'Data architecture and infrastructure choices shape performance, reliability, and how a product can grow over time.'],
    security: ['CYBERSECURITY & RESEARCH', 'Think', 'one step deeper.', 'Research and security thinking help uncover assumptions, understand risk, and build technology with greater care.'],
    creative: ['CREATIVE DEVELOPMENT', 'Let code', 'be expressive.', 'Creative development is a space for using code to make responsive visuals, unusual interactions, and experiences that invite exploration.'],
    design: ['DESIGN & PROTOTYPING', 'Try the idea', 'before it ships.', 'Design and prototyping help make an idea tangible, invite feedback, and improve the experience before implementation hardens.']
  };
  const toolDetail = document.querySelector('.tool-detail');
  document.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-tool]').forEach(item => item.classList.toggle('active', item === button));
    const data = toolData[button.dataset.tool];
    if (!data || !toolDetail) return;
    toolDetail.querySelector('.tool-icon').textContent = ['✳', '◉', '⌘', '✦', '◌', '⌁', '✳', '◇'][[...document.querySelectorAll('[data-tool]')].indexOf(button)];
    toolDetail.querySelector('p:nth-of-type(1)').textContent = data[0];
    toolDetail.querySelector('h2').innerHTML = `${data[1]}<br><em>${data[2]}</em>`;
    toolDetail.querySelector('.tool-description').textContent = data[3];
  }));

  const form = document.querySelector('#contact-form');
  if (form) form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const name = String(values.get('name')).trim();
    const email = String(values.get('email')).trim();
    const subject = String(values.get('subject')).trim();
    const message = String(values.get('message')).trim();
    const body = `Hello Harrison,\n\n${message}\n\n— ${name}\n${email}`;
    const status = document.querySelector('#form-status');
    status.textContent = 'YOUR EMAIL APP IS OPENING WITH THE MESSAGE DRAFT…';
    location.href = `mailto:?subject=${encodeURIComponent(subject || 'Hello Harrison')}&body=${encodeURIComponent(body)}`;
    setTimeout(() => { status.textContent = 'DRAFT READY. CHOOSE A RECIPIENT IN YOUR EMAIL APP TO SEND.'; }, 1300);
  });

  if (!reduced && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.round-link,.cta-orb,.pill-link,.submit-button').forEach(button => {
      button.addEventListener('pointermove', event => {
        const rect = button.getBoundingClientRect();
        button.style.translate = `${(event.clientX - rect.left - rect.width / 2) * .09}px ${(event.clientY - rect.top - rect.height / 2) * .09}px`;
      });
      button.addEventListener('pointerleave', () => { button.style.translate = '0 0'; });
    });
  }
})();
