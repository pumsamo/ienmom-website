function storyDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value || '';
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
}

async function loadHomeStories() {
  const container = document.querySelector('[data-home-stories]');
  if (!container) return;

  try {
    const response = await fetch('story/posts.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('이야기를 불러오지 못했습니다.');
    const posts = await response.json();
    posts
      .slice()
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
      .slice(0, 3)
      .forEach((post) => {
        const article = document.createElement('article');
        article.className = 'home-story-card reveal';
        const link = document.createElement('a');
        link.href = post.url ? `story/${post.url}` : `story/post.html?id=${encodeURIComponent(post.id || '')}`;

        const time = document.createElement('time');
        time.dateTime = post.date || '';
        time.textContent = storyDate(post.date);
        const title = document.createElement('h3');
        title.textContent = post.title || '(제목 없음)';
        const summary = document.createElement('p');
        summary.textContent = post.summary || '';
        const arrow = document.createElement('span');
        arrow.textContent = '읽어보기 →';

        link.append(time, title, summary, arrow);
        article.append(link);
        container.append(article);
        window.registerReveal(article);
      });
    container.removeAttribute('aria-busy');
  } catch (error) {
    container.innerHTML = '<p class="story-error">이야기를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>';
    container.removeAttribute('aria-busy');
  }
}

loadHomeStories();
