const formatPrice = new Intl.NumberFormat('ko-KR');

function createProductCard(product, index) {
  const article = document.createElement('article');
  article.className = 'store-product reveal';

  const imageLink = document.createElement('a');
  imageLink.className = 'store-product-image';
  imageLink.href = product.url;
  imageLink.target = '_blank';
  imageLink.rel = 'noreferrer';
  imageLink.setAttribute('aria-label', `${product.name} 구매 페이지 열기`);

  const image = document.createElement('img');
  image.src = product.image;
  image.alt = product.name;
  image.loading = index < 3 ? 'eager' : 'lazy';
  image.decoding = 'async';
  imageLink.append(image);

  const info = document.createElement('div');
  info.className = 'store-product-info';

  const name = document.createElement('h3');
  name.textContent = product.name;

  const tagline = document.createElement('p');
  tagline.className = 'product-tagline';
  tagline.textContent = product.tagline || '';

  const price = document.createElement('p');
  price.className = 'product-price';
  price.textContent = `${formatPrice.format(product.price)}원`;

  const buy = document.createElement('a');
  buy.className = 'buy-button';
  buy.href = product.url;
  buy.target = '_blank';
  buy.rel = 'noreferrer';
  buy.textContent = '장바구니 담기';
  buy.setAttribute('aria-label', `${product.name} 장바구니에 담기`);
  buy.setAttribute('data-cart-add', '');
  buy.dataset.name = product.name;
  buy.dataset.price = String(product.price);
  buy.dataset.url = product.url;

  info.append(name, tagline, price, buy);
  article.append(imageLink, info);
  return article;
}

function createFeaturedProduct(product) {
  const article = document.createElement('article');
  article.className = 'curated-feature reveal';

  const imageLink = document.createElement('a');
  imageLink.className = 'curated-feature-image';
  imageLink.href = product.url;
  imageLink.target = '_blank';
  imageLink.rel = 'noreferrer';
  imageLink.setAttribute('aria-label', `${product.name} 구매 페이지 열기`);
  const image = document.createElement('img');
  image.src = product.image;
  image.alt = product.name;
  image.decoding = 'async';
  imageLink.append(image);

  const copy = document.createElement('div');
  copy.className = 'curated-feature-copy';
  const label = document.createElement('p');
  label.className = 'kicker terracotta';
  label.textContent = 'SIGNATURE GIFT';
  const name = document.createElement('h3');
  name.className = 'curated-feature-title';
  ['아이엔맘', '무색소 수제 마카롱', '10구 선물세트'].forEach((line) => {
    const span = document.createElement('span');
    span.textContent = line;
    name.append(span);
  });
  const tagline = document.createElement('p');
  tagline.className = 'curated-feature-tagline';
  tagline.textContent = product.tagline || '';
  const price = document.createElement('p');
  price.className = 'curated-feature-price';
  price.textContent = `${formatPrice.format(product.price)}원`;
  const buy = document.createElement('a');
  buy.className = 'buy-button';
  buy.href = product.url;
  buy.target = '_blank';
  buy.rel = 'noreferrer';
  buy.textContent = '장바구니 담기';
  buy.setAttribute('aria-label', `${product.name} 장바구니에 담기`);
  buy.setAttribute('data-cart-add', '');
  buy.dataset.name = product.name;
  buy.dataset.price = String(product.price);
  buy.dataset.url = product.url;
  copy.append(label, name, tagline, price, buy);
  article.append(imageLink, copy);
  return article;
}

function renderCuratedProducts(container, products) {
  const featured = products.find((product) => product.name.includes('10구 선물세트'));
  if (!featured) throw new Error('대표 제품을 찾지 못했습니다.');
  const featuredSlot = container.querySelector('[data-featured-product]');
  const grid = container.querySelector('[data-curated-grid]');
  const featuredCard = createFeaturedProduct(featured);
  featuredSlot.append(featuredCard);
  window.registerReveal(featuredCard);
  products.filter((product) => product !== featured).slice(0, 6).forEach((product, index) => {
    const card = createProductCard(product, index);
    grid.append(card);
    window.registerReveal(card);
  });
  container.removeAttribute('aria-busy');
}

async function loadProducts() {
  const grids = document.querySelectorAll('[data-product-grid]');
  const curated = document.querySelector('[data-curated-products]');
  if (!grids.length && !curated) return;

  try {
    const response = await fetch('products.json');
    if (!response.ok) throw new Error('제품 정보를 불러오지 못했습니다.');
    const products = await response.json();

    grids.forEach((grid) => {
      const limit = Number(grid.dataset.limit) || products.length;
      products.slice(0, limit).forEach((product, index) => grid.append(createProductCard(product, index)));
      grid.removeAttribute('aria-busy');

      grid.querySelectorAll('.reveal').forEach((card) => window.registerReveal(card));
    });
    if (curated) renderCuratedProducts(curated, products);
  } catch (error) {
    grids.forEach((grid) => {
      grid.innerHTML = '<p class="product-error">제품 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>';
      grid.removeAttribute('aria-busy');
    });
    if (curated) {
      curated.innerHTML = '<p class="product-error">제품 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>';
      curated.removeAttribute('aria-busy');
    }
  }
}

loadProducts();
