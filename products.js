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

  const price = document.createElement('p');
  price.textContent = `${formatPrice.format(product.price)}원`;

  const buy = document.createElement('a');
  buy.className = 'buy-button';
  buy.href = product.url;
  buy.target = '_blank';
  buy.rel = 'noreferrer';
  buy.textContent = '구매하기 ↗';
  buy.setAttribute('aria-label', `${product.name} 구매하기`);

  info.append(name, price, buy);
  article.append(imageLink, info);
  return article;
}

async function loadProducts() {
  const grids = document.querySelectorAll('[data-product-grid]');
  if (!grids.length) return;

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
  } catch (error) {
    grids.forEach((grid) => {
      grid.innerHTML = '<p class="product-error">제품 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>';
      grid.removeAttribute('aria-busy');
    });
  }
}

loadProducts();
