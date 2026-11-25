/**
 * Document Picture-in-Picture API Manager with fallback popup window.
 * Enables an always-on-top, draggable floating mini-timer anywhere on screen.
 */

interface DocumentPictureInPicture {
  requestWindow(options?: {
    width?: number;
    height?: number;
    disallowReturnToOpener?: boolean;
  }): Promise<Window>;
  readonly window: Window | null;
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
  }
}

export function isDocumentPipSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'documentPictureInPicture' in window &&
    typeof window.documentPictureInPicture?.requestWindow === 'function'
  );
}

function copyStylesToWindow(targetWindow: Window): void {
  const targetDoc = targetWindow.document;
  for (const styleSheet of Array.from(document.styleSheets)) {
    try {
      const cssRules = Array.from(styleSheet.cssRules)
        .map((rule) => rule.cssText)
        .join('\n');
      const style = targetDoc.createElement('style');
      style.textContent = cssRules;
      targetDoc.head.appendChild(style);
    } catch {
      if (styleSheet.href) {
        const link = targetDoc.createElement('link');
        link.rel = 'stylesheet';
        link.href = styleSheet.href;
        targetDoc.head.appendChild(link);
      }
    }
  }
}

export interface FloatingWindowHandle {
  win: Window;
  container: HTMLElement;
  isNativePip: boolean;
  close: () => void;
}

export async function openFloatingTimerWindow(
  onClosed: () => void,
): Promise<FloatingWindowHandle | null> {
  try {
    let win: Window | null = null;
    let isNativePip = false;

    if (isDocumentPipSupported() && window.documentPictureInPicture) {
      win = await window.documentPictureInPicture.requestWindow({
        width: 268,
        height: 84,
      });
      isNativePip = true;
    } else {
      // Fallback for browsers without Document Picture-in-Picture
      const left = Math.max(20, window.screen.availWidth - 296);
      const top = 60;
      win = window.open(
        '',
        'tempo_floating_timer',
        `popup=yes,width=268,height=88,left=${left},top=${top}`,
      );
      isNativePip = false;
    }

    if (!win) return null;

    win.document.title = 'timo';
    win.document.body.innerHTML = '';
    win.document.body.className =
      'bg-[#FAFAFA] text-[#111827] antialiased overflow-hidden select-none m-0 p-0';

    copyStylesToWindow(win);

    const container = win.document.createElement('div');
    container.id = 'pip-root';
    container.className = 'w-full h-full';
    win.document.body.appendChild(container);

    const handleClose = () => {
      onClosed();
    };
    win.addEventListener('pagehide', handleClose, { once: true });
    win.addEventListener('beforeunload', handleClose, { once: true });

    return {
      win,
      container,
      isNativePip,
      close: () => {
        try {
          win?.close();
        } catch {
          // Ignore close errors
        }
      },
    };
  } catch {
    return null;
  }
}
