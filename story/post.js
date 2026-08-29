(function () {
  const main = document.querySelector('#post-main');

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function fmtDate(value) {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value || '';
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
  }

  function hrefOf(post) {
    return post.url ? String(post.url) : `post.html?id=${encodeURIComponent(post.id || '')}`;
  }

  function renderBody(source) {
    const box = el('div', 'post-body');
    String(source || '').replace(/\r\n/g, '\n').split(/\n\s*\n/).forEach((raw) => {
      const block = raw.trim();
      if (!block) return;
      const lines = block.split('\n');
      if (lines.every((line) => /^- /.test(line.trim()))) {
        const list = el('ul');
        lines.forEach((line) => list.append(el('li', null, line.trim().slice(2))));
        box.append(list);
      } else if (/^## /.test(block)) {
        box.append(el('h2', null, block.slice(3).trim()));
      } else {
        box.append(el('p', null, block));
      }
    });
    return box;
  }

  function setMeta(post) {
    const title = String(post.title || '이야기');
    const description = String(post.description || post.summary || '').slice(0, 160);
    const canonical = `${location.origin}${location.pathname}?id=${encodeURIComponent(post.id || '')}`;
    document.title = `${title} | 아이엔맘`;
    document.querySelector('meta[name="description"]').content = description;
    document.querySelector('meta[name="author"]').content = String(post.author || '');
    document.querySelector('link[rel="canonical"]').href = canonical;
    document.querySelector('meta[property="og:title"]').content = title;
    document.querySelector('meta[property="og:description"]').content = description;
    document.querySelector('meta[property="og:url"]').content = canonical;

    const structured = document.createElement('script');
    structured.type = 'application/ld+json';
    structured.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description,
      datePublished: post.date || '',
      dateModified: post.updated || post.date || '',
      mainEntityOfPage: canonical,
      author: post.author ? { '@type': 'Person', name: post.author } : undefined
    });
    document.head.append(structured);
  }

  function renderFaq(items) {
    const section = el('section', 'post-faq');
    section.append(el('h2', null, '자주 묻는 질문'));
    items.forEach((item) => {
      const details = el('details');
      details.append(el('summary', null, item.q), el('p', null, item.a));
      section.append(details);
    });
    return section;
  }

  function renderSources(items) {
    const section = el('section', 'post-sources');
    section.append(el('h2', null, '참고·출처'));
    const list = el('ol');
    items.forEach((item) => {
      const row = el('li');
      if (item.url) {
        const link = el('a', null, item.title || item.url);
        link.href = item.url;
        link.target = '_blank';
        link.rel = 'noreferrer';
        row.append(link);
      } else row.textContent = item.title || '';
      list.append(row);
    });
    section.append(list);
    return section;
  }

  function notFound() {
    const box = el('div', 'post-notfound');
    box.append(el('h1', null, '글을 찾을 수 없습니다'), el('p', null, '주소가 잘못되었거나 삭제된 글일 수 있어요.'));
    const link = el('a', null, '이야기 목록으로 돌아가기');
    link.href = 'index.html';
    box.append(link);
    main.append(box);
  }

  function render(posts) {
    const id = new URLSearchParams(location.search).get('id') || '';
    const post = posts.find((item) => String(item.id) === id);
    if (!post) { notFound(); return; }
    setMeta(post);

    const article = el('article', 'story-article reveal');
    const head = el('header', 'post-head');
    const time = el('time', null, fmtDate(post.date));
    time.dateTime = post.date || '';
    const title = el('h1', null, post.title || '(제목 없음)');
    head.append(time, title);
    if (post.author || post.updated) {
      const meta = el('p', 'post-meta');
      meta.textContent = [post.author, post.updated ? `수정 ${fmtDate(post.updated)}` : ''].filter(Boolean).join(' · ');
      head.append(meta);
    }
    article.append(head, el('hr', 'post-rule'), renderBody(post.body));
    if (Array.isArray(post.faq) && post.faq.length) article.append(renderFaq(post.faq));
    if (Array.isArray(post.sources) && post.sources.length) article.append(renderSources(post.sources));

    const sorted = posts.slice().sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
    const index = sorted.findIndex((item) => item.id === post.id);
    const nav = el('nav', 'post-nav');
    nav.setAttribute('aria-label', '이전 글과 다음 글');
    [{ post: sorted[index - 1], direction: '이전 글', className: 'prev' }, { post: sorted[index + 1], direction: '다음 글', className: 'next' }].forEach((item) => {
      if (!item.post) { nav.append(el('span')); return; }
      const link = el('a', item.className);
      link.href = hrefOf(item.post);
      link.append(el('span', 'dir', item.direction), el('div', 'pn-title', item.post.title || '(제목 없음)'));
      nav.append(link);
    });
    article.append(nav);
    main.append(article);
    window.registerReveal(article);
  }

  fetch('posts.json', { cache: 'no-store' })
    .then((response) => { if (!response.ok) throw new Error(response.status); return response.json(); })
    .then(render)
    .catch(notFound);
}());
