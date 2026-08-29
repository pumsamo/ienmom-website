const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.main-nav');
function closeMenu() {
  navigation.classList.remove('open');
  document.body.classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', '메뉴 열기');
}
menuButton.addEventListener('click', () => {
  const open = !navigation.classList.contains('open');
  navigation.classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
});
navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
const reveals = document.querySelectorAll('.reveal');
window.registerReveal = (element) => element.classList.add('is-visible');
reveals.forEach((element) => window.registerReveal(element));
document.querySelector('#year').textContent = new Date().getFullYear();
