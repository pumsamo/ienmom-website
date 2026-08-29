const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.main-nav');
const navLinks = [...document.querySelectorAll('.main-nav a')];

function closeMenu() {
  menuButton.classList.remove('open');
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', '메뉴 열기');
}

menuButton.addEventListener('click', () => {
  const willOpen = !nav.classList.contains('open');
  menuButton.classList.toggle('open', willOpen);
  nav.classList.toggle('open', willOpen);
  menuButton.setAttribute('aria-expanded', String(willOpen));
  menuButton.setAttribute('aria-label', willOpen ? '메뉴 닫기' : '메뉴 열기');
});

navLinks.forEach((link) => link.addEventListener('click', closeMenu));

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 24);
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const sections = [...document.querySelectorAll('main section[id]')];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navLinks.forEach((link) => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
    }
  });
}, { rootMargin: '-45% 0px -50%' });
sections.forEach((section) => sectionObserver.observe(section));

document.querySelectorAll('.filter').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    document.querySelectorAll('.product-card').forEach((card) => {
      card.classList.toggle('hidden', button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter);
    });
  });
});

document.querySelector('#contact-form').addEventListener('submit', (event) => {
  event.preventDefault();
  event.currentTarget.querySelector('.form-status').textContent = '문의 폼은 준비 중이에요. 지금은 이메일 또는 인스타그램으로 연락해 주세요.';
});

document.querySelector('#year').textContent = new Date().getFullYear();
