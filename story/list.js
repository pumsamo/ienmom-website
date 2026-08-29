(function () {
  const list = document.querySelector('#story-list');

  function fmtDate(value) {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value || '';
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
  }

  function render(posts) {
    if (!Array.isArray(posts) || !posts.length) {
      list.innerHTML = '<li class="story-empty">아직 올라온 글이 없습니다.</li>';
      return;
    }

    posts.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).forEach((post) => {
      const item = document.createElement('li');
      item.className = 'story-card reveal';
      const link = document.createElement('a');
      link.href = post.url ? String(post.url) : `post.html?id=${encodeURIComponent(post.id || '')}`;
      const time = document.createElement('time');
      time.dateTime = post.date || '';
      time.textContent = fmtDate(post.date);
      const title = document.createElement('h2');
      title.textContent = post.title || '(제목 없음)';
      const summary = document.createElement('p');
      summary.className = 'summary';
      summary.textContent = post.summary || '';
      link.append(time, title, summary);

      if (Array.isArray(post.tags) && post.tags.length) {
        const tags = document.createElement('div');
        tags.className = 'story-tags';
        post.tags.forEach((value) => {
          const tag = document.createElement('span');
          tag.className = 'story-tag';
          tag.textContent = value;
          tags.append(tag);
        });
        link.append(tags);
      }
      item.append(link);
      list.append(item);
      window.registerReveal(item);
    });
  }

  fetch('posts.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(response.status);
      return response.json();
    })
    .then(render)
    .catch(() => { list.innerHTML = '<li class="story-error">글 목록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.</li>'; });
}());
