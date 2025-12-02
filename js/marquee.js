/**
 * Initializes a seamless horizontal marquee.
 * Exported to be called after API data loads.
 */
export function initSeamlessMarquee(trackId) {
  const track = document.getElementById(trackId);
  if (!track) return;

  // ... (Rest of your existing logic: measure width, clone children, create style) ...
  // Copy your existing logic here, just wrap it in 'export function'

  // Ensure we don't double-init
  if (track.classList.contains("marquee-initialized")) return;
  track.classList.add("marquee-initialized");

  const originalContentWidth = track.scrollWidth;
  const gap = 24;

  // Clone logic
  const children = Array.from(track.children);
  children.forEach((child) => {
    const clone = child.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });

  // Animation Logic
  const animationName = `scroll-${trackId}`;
  const styleSheet = document.createElement("style");
  const moveDistance = originalContentWidth + gap;

  const keyframes = `
        @keyframes ${animationName} {
            0% { transform: translateX(0); }
            100% { transform: translateX(-${moveDistance}px); }
        }
    `;

  const animationClass = `
        #${trackId} {
            animation: ${animationName} 40s linear infinite; /* Slower for better UX */
        }
        .group:hover #${trackId} {
            animation-play-state: paused;
        }
    `;

  styleSheet.textContent = keyframes + animationClass;
  document.head.appendChild(styleSheet);
}

// Attach to window for fallback if not using modules everywhere
window.initSeamlessMarquee = initSeamlessMarquee;
