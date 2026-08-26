declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export async function detectVimeoDuration(url: string): Promise<number | null> {
  try {
    const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && typeof data.duration === 'number') {
      return data.duration;
    }
    return null;
  } catch (e) {
    return null;
  }
}

let ytApiLoaded = false;
export function loadYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    if (ytApiLoaded) {
      const check = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      return;
    }
    ytApiLoaded = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    
    window.onYouTubeIframeAPIReady = () => {
      resolve();
    };
  });
}

export function extractYouTubeId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

export async function detectYouTubeDuration(videoId: string): Promise<number | null> {
  await loadYouTubeApi();
  
  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.id = 'yt-temp-' + Math.random().toString(36).substring(7);
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    let player: any;
    const timeout = setTimeout(() => {
      if (document.body.contains(container)) {
        if (player && typeof player.destroy === 'function') {
          player.destroy();
        }
        document.body.removeChild(container);
        resolve(null);
      }
    }, 8000);

    player = new window.YT.Player(container.id, {
      videoId: videoId,
      events: {
        onReady: (event: any) => {
          clearTimeout(timeout);
          const duration = event.target.getDuration();
          event.target.destroy();
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
          resolve(duration > 0 ? duration : null);
        },
        onError: () => {
          clearTimeout(timeout);
          if (player && typeof player.destroy === 'function') {
            player.destroy();
          }
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
          resolve(null);
        }
      }
    });
  });
}
