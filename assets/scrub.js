(() => {
  const section = document.querySelector('.rd-scrub');
  const video = section?.querySelector('.rd-scrub__video');

  if (!section || !video) return;

  section.dataset.scrubReady = 'true';

  const mobileQuery = window.matchMedia('(max-width: 760px)');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let duration = 0;
  let frameRequested = false;

  const selectMedia = () => {
    const mode = mobileQuery.matches ? 'mobile' : 'desktop';
    const nextSource = video.dataset[`${mode}Src`];
    const nextPoster = video.dataset[`${mode}Poster`];

    video.poster = nextPoster;
    if (video.getAttribute('src') !== nextSource) {
      video.src = nextSource;
      video.load();
    }
  };

  const updateFrame = () => {
    frameRequested = false;
    if (motionQuery.matches || !duration) return;

    const rect = section.getBoundingClientRect();
    const scrollRange = Math.max(section.offsetHeight - window.innerHeight, 1);
    const progress = Math.min(1, Math.max(0, -rect.top / scrollRange));
    const targetTime = progress * Math.max(duration - 0.04, 0);

    section.style.setProperty('--rd-scrub-progress', progress.toFixed(4));

    if (Math.abs(video.currentTime - targetTime) > 0.015) {
      video.currentTime = targetTime;
    }
  };

  const requestFrame = () => {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(updateFrame);
  };

  const onMetadata = () => {
    duration = Number.isFinite(video.duration) ? video.duration : 0;
    video.pause();
    requestFrame();
  };

  selectMedia();
  video.addEventListener('loadedmetadata', onMetadata);
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame, { passive: true });
  mobileQuery.addEventListener('change', selectMedia);
  motionQuery.addEventListener('change', requestFrame);

  if (video.readyState >= 1) onMetadata();
})();
