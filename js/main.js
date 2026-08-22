(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const COUNTER_ID = 111456931;

  function goal(name) {
    if (typeof window.ym === 'function') {
      window.ym(COUNTER_ID, 'reachGoal', name);
    }
  }

  const site = $('#ls-catering-site');
  const header = $('#lsHeader');
  const menuBtn = $('#lsMenu');
  const nav = $('#lsNav');
  const progress = $('#lsProgress');

  /* Header + scroll progress */
  function onScroll() {
    const y = window.scrollY || 0;
    if (header) header.classList.toggle('scrolled', y > 18);
    if (progress) {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progress.style.width = `${Math.min(100, (y / max) * 100)}%`;
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  function closeMenu() {
    if (!header || !menuBtn) return;
    header.classList.remove('open');
    document.body.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
  if (menuBtn && header) {
    menuBtn.addEventListener('click', () => {
      const open = !header.classList.contains('open');
      header.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }
  $$('#lsNav a').forEach(a => a.addEventListener('click', closeMenu));

  /* Reveal animation — replay whenever a section re-enters the viewport. */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
        } else {
          entry.target.classList.remove('is-in');
        }
      });
    }, { rootMargin: '-4% 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-in'));
  }


  /* Dedicated tasting animation — replay when scrolling down or back up. */
  const tastingSection = $('.ls-tasting');
  const tastingCard = $('.ls-tasting-slide');
  if (tastingSection && tastingCard) {
    let tastingTimer = null;
    const showTastingCard = () => tastingCard.classList.add('is-in');
    const hideTastingCard = () => tastingCard.classList.remove('is-in');
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const tastingObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.28) {
            window.clearTimeout(tastingTimer);
            tastingTimer = window.setTimeout(showTastingCard, 90);
          } else if (!entry.isIntersecting || entry.intersectionRatio < 0.08) {
            window.clearTimeout(tastingTimer);
            hideTastingCard();
          }
        });
      }, { threshold: [0, 0.08, 0.28, 0.4] });
      tastingObserver.observe(tastingSection);
    } else {
      showTastingCard();
    }
  }

  /* Hero slider. Second image is requested after the first screen is already usable. */
  const heroSlides = $$('.ls-hero-bg');
  const heroDots = $$('.ls-hero-dot');
  let heroIndex = 0;
  let heroTimer = null;

  function heroImagePath() {
    const w = window.innerWidth;
    if (w <= 600) return 'assets/images/hero-02-430.webp';
    if (w <= 900) return 'assets/images/hero-02-768.webp';
    if (w < 1400) return 'assets/images/hero-02-1086.webp';
    return 'assets/images/hero-02-1086.webp';
  }

  function loadSecondHero() {
    if (heroSlides[1] && !heroSlides[1].dataset.loaded) {
      heroSlides[1].style.backgroundImage = `url("${heroImagePath()}")`;
      heroSlides[1].dataset.loaded = '1';
    }
  }

  function showHero(index) {
    if (!heroSlides.length) return;
    heroIndex = (index + heroSlides.length) % heroSlides.length;
    heroSlides.forEach((slide, i) => slide.classList.toggle('active', i === heroIndex));
    heroDots.forEach((dot, i) => dot.classList.toggle('active', i === heroIndex));
  }

  function startHero() {
    if (heroSlides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    clearInterval(heroTimer);
    heroTimer = window.setInterval(() => showHero(heroIndex + 1), 7000);
  }

  heroDots.forEach((dot, i) => dot.addEventListener('click', () => {
    loadSecondHero();
    showHero(i);
    startHero();
  }));

  const deferHero = () => { loadSecondHero(); startHero(); };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(deferHero, { timeout: 1800 });
  } else {
    window.setTimeout(deferHero, 900);
  }

  /* Lazy CSS background for tasting section */
  $$('[data-bg]').forEach(el => {
    const load = () => {
      if (el.dataset.bgLoaded) return;
      el.style.backgroundImage = `url("${el.dataset.bg}")`;
      el.dataset.bgLoaded = '1';
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) {
          load();
          observer.disconnect();
        }
      }, { rootMargin: '500px 0px' });
      observer.observe(el);
    } else {
      load();
    }
  });

  /* Mobile review expansion */
  const reviewMore = $('#reviewMore');
  const reviewGrid = $('.ls-review-grid');
  if (reviewMore && reviewGrid) {
    reviewMore.addEventListener('click', () => {
      const expanded = reviewGrid.classList.toggle('expanded');
      reviewMore.textContent = expanded ? 'Скрыть дополнительные отзывы' : 'Показать ещё отзывы';
      reviewMore.setAttribute('aria-expanded', String(expanded));
    });
  }

  /* Lightbox for portfolio photos — premium navigation */
  const lightbox = $('#lightbox');
  const lbContent = $('#lbContent');
  const lbCounter = $('#lbCounter');
  const galleryButtons = $$('[data-lightbox]');
  let activeGalleryIndex = 0;

  function renderGalleryImage(index) {
    if (!lbContent || !galleryButtons.length) return;
    activeGalleryIndex = (index + galleryButtons.length) % galleryButtons.length;
    const button = galleryButtons[activeGalleryIndex];
    const img = $('img', button);
    const alt = img?.alt || 'Фото Love Story Catering';
    lbContent.innerHTML = `<img src="${button.dataset.lightbox}" alt="${alt.replace(/"/g, '&quot;')}">`;
    if (lbCounter) lbCounter.textContent = `${activeGalleryIndex + 1} / ${galleryButtons.length}`;
  }

  function openGallery(index) {
    if (!lightbox || !lbContent) return;
    renderGalleryImage(index);
    lightbox.hidden = false;
    document.body.classList.add('modal-open');
    $('.ls-close', lightbox)?.focus();
  }
  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    const video = $('video', lightbox);
    if (video) video.pause();
    lightbox.hidden = true;
    if (lbContent) lbContent.innerHTML = '';
    document.body.classList.remove('modal-open');
  }
  galleryButtons.forEach((button, index) => {
    button.addEventListener('click', () => openGallery(index));
  });
  $('.ls-lightbox-prev', lightbox || document)?.addEventListener('click', () => renderGalleryImage(activeGalleryIndex - 1));
  $('.ls-lightbox-next', lightbox || document)?.addEventListener('click', () => renderGalleryImage(activeGalleryIndex + 1));
  $('.ls-close', lightbox || document)?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lightbox || lightbox.hidden) return;
    if (e.key === 'ArrowLeft') renderGalleryImage(activeGalleryIndex - 1);
    if (e.key === 'ArrowRight') renderGalleryImage(activeGalleryIndex + 1);
  });

  /* Request modal */
  const modal = $('#formModal');
  let lastFocus = null;
  function openForm() {
    if (!modal) return;
    closeMenu();
    closeChat();
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    window.setTimeout(() => $('input', modal)?.focus(), 0);
  }
  function closeForm() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }
  $$('.js-open-form').forEach(btn => btn.addEventListener('click', openForm));
  $('.ls-close', modal || document)?.addEventListener('click', closeForm);
  modal?.addEventListener('click', e => { if (e.target === modal) closeForm(); });

  /* Forms -> WhatsApp */
  function submitRequest(form) {
    const data = new FormData(form);
    const text = [
      'Здравствуйте! Хочу получить расчёт Love Story Catering.',
      '',
      `Имя: ${data.get('name') || '—'}`,
      `Телефон: ${data.get('phone') || '—'}`,
      `Мероприятие: ${data.get('event') || '—'}`,
      `Гостей: ${data.get('guests') || '—'}`
    ].join('\n');
    goal('form_submit');
    window.open(`https://wa.me/79262062799?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }
  ['mainForm', 'modalForm'].forEach(id => {
    const form = document.getElementById(id);
    form?.addEventListener('submit', e => {
      e.preventDefault();
      submitRequest(form);
      if (id === 'modalForm') closeForm();
    });
  });

  /* Chat -> WhatsApp */
  const chat = $('#lsChat');
  const chatLaunch = $('#chatLaunch');
  const chatClose = $('.ls-chat-close');
  const chatForm = $('#chatForm');

  function openChat() {
    if (!chat) return;
    closeMenu();
    if (modal && !modal.hidden) closeForm();
    chat.hidden = false;
    document.body.classList.add('chat-open');
    chatLaunch?.setAttribute('aria-expanded', 'true');
    goal('chat_open');
    window.setTimeout(() => $('input', chat)?.focus(), 0);
  }
  function closeChat() {
    if (!chat || chat.hidden) return;
    chat.hidden = true;
    document.body.classList.remove('chat-open');
    chatLaunch?.setAttribute('aria-expanded', 'false');
  }
  chatLaunch?.addEventListener('click', openChat);
  chatClose?.addEventListener('click', closeChat);
  chatForm?.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(chatForm);
    const text = [
      'Здравствуйте! Заявка с сайта Love Story Catering.',
      '',
      `Имя: ${data.get('name') || '—'}`,
      `Телефон: ${data.get('phone') || '—'}`,
      `Сообщение: ${data.get('message') || '—'}`
    ].join('\n');
    goal('chat_whatsapp');
    window.open(`https://wa.me/79262062799?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });

  /* Existing and new Yandex Metrika goals */
  $$('.js-goal-phone').forEach(a => a.addEventListener('click', () => goal('click_phone')));
  $$('.js-goal-whatsapp').forEach(a => a.addEventListener('click', () => goal('click_whatsapp')));
  $$('.js-goal-telegram').forEach(a => a.addEventListener('click', () => goal('click_telegram')));
  $$('.js-goal-tasting').forEach(a => a.addEventListener('click', () => goal('click_tasting')));
  $$('.js-goal-promo').forEach(a => a.addEventListener('click', () => goal('promo_request')));
  $$('.js-yandex-reviews').forEach(a => a.addEventListener('click', () => goal('yandex_reviews_click')));
  $$('.js-yandex-map').forEach(a => a.addEventListener('click', () => goal('yandex_map_click')));

  /* Escape key */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeMenu();
    closeLightbox();
    closeForm();
    closeChat();
  });

  /* Keep dynamic hero asset appropriate after orientation change. */
  window.addEventListener('resize', () => {
    if (heroSlides[1]?.dataset.loaded) {
      heroSlides[1].style.backgroundImage = `url("${heroImagePath()}")`;
    }
  }, { passive: true });

  /* Avoid an unused reference warning in strict build checks. */
  void site;

  /* V3.9 visual accents */
  const progressBar = document.querySelector('.ls-scroll-progress span');
  const updateProgress = () => {
    if (!progressBar) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    progressBar.style.transform = `scaleX(${ratio})`;
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });

  const heroVisual = document.querySelector('.ls-hero');
  if (heroVisual && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    heroVisual.addEventListener('pointermove', e => {
      const r = heroVisual.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      heroVisual.style.setProperty('--mx', `${x * 10}px`);
      heroVisual.style.setProperty('--my', `${y * 7}px`);
    });
    heroVisual.addEventListener('pointerleave', () => {
      heroVisual.style.setProperty('--mx', '0px');
      heroVisual.style.setProperty('--my', '0px');
    });
  }

  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('.ls-portfolio,.ls-advantages-v8,.ls-services-v8,.ls-reviews').forEach(section => {
      section.addEventListener('pointermove', e => {
        const r = section.getBoundingClientRect();
        section.style.setProperty('--spot-x', `${e.clientX - r.left}px`);
        section.style.setProperty('--spot-y', `${e.clientY - r.top}px`);
      });
      section.addEventListener('pointerleave', () => {
        section.style.setProperty('--spot-x', '-999px');
        section.style.setProperty('--spot-y', '-999px');
      });
    });
  }


  /* V4.0 signature storyline path */
  const storySection = document.querySelector('.ls-storyline');
  const storyPath = document.getElementById('lsStoryPath');
  if (storySection && storyPath && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const length = storyPath.getTotalLength();
    storyPath.style.strokeDasharray = String(length);
    storyPath.style.strokeDashoffset = String(length);
    const updateStoryPath = () => {
      const r = storySection.getBoundingClientRect();
      const start = window.innerHeight * .78;
      const end = window.innerHeight * .18;
      const progress = Math.min(1, Math.max(0, (start - r.top) / (r.height + start - end)));
      storyPath.style.strokeDashoffset = String(length * (1 - progress));
    };
    updateStoryPath();
    window.addEventListener('scroll', updateStoryPath, { passive: true });
    window.addEventListener('resize', updateStoryPath, { passive: true });
  }

})();

/* V5.0 — packed masonry portfolio, no internal empty spaces */
(function(){
  const gallery = document.getElementById('portfolioGallery');
  if (!gallery) return;

  const layout = () => {
    const items = Array.from(gallery.querySelectorAll('.ls-gallery-item'));
    if (!items.length) return;

    if (window.innerWidth < 700) {
      gallery.style.height = '';
      items.forEach(item => {
        item.style.left = '';
        item.style.top = '';
        item.style.width = '';
      });
      return;
    }

    const galleryWidth = gallery.clientWidth;
    const columns = window.innerWidth >= 1200 ? 2 : 2;
    const colWidth = galleryWidth / columns;
    const heights = new Array(columns).fill(0);

    items.forEach(item => {
      item.style.width = colWidth + 'px';
      const img = item.querySelector('img');
      const naturalW = Number(img?.getAttribute('width')) || img?.naturalWidth || 1;
      const naturalH = Number(img?.getAttribute('height')) || img?.naturalHeight || 1;
      const itemHeight = colWidth * naturalH / naturalW;

      let col = 0;
      for (let i = 1; i < columns; i++) {
        if (heights[i] < heights[col]) col = i;
      }

      item.style.left = (col * colWidth) + 'px';
      item.style.top = heights[col] + 'px';
      item.style.height = itemHeight + 'px';
      heights[col] += itemHeight;
    });

    gallery.style.height = Math.max(...heights) + 'px';
  };

  const relayout = () => requestAnimationFrame(layout);
  window.addEventListener('load', relayout, {once:true});
  window.addEventListener('resize', relayout, {passive:true});
  gallery.querySelectorAll('img').forEach(img => {
    if (!img.complete) img.addEventListener('load', relayout, {once:true});
  });
  relayout();
})();
