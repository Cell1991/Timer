import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AmbientBar } from './components/AmbientBar';
import { FloatingPipView } from './components/FloatingPipView';
import { ModeSelector } from './components/ModeSelector';
import { TimoLogo } from './components/TimoLogo';
import { TimerDisplay } from './components/TimerDisplay';
import {
  initMainSyncHost,
  isDesktopApp,
} from './services/desktopSync';
import {
  openFloatingTimerWindow,
  type FloatingWindowHandle,
} from './services/pipManager';
import { useTimerStore } from './store/useTimerStore';

export function App() {
  const startOrResume = useTimerStore((s) => s.startOrResume);
  const hydrateFromServer = useTimerStore((s) => s.hydrateFromServer);

  const [pipHandle, setPipHandle] = useState<FloatingWindowHandle | null>(null);
  const [desktopWidgetOpen, setDesktopWidgetOpen] = useState(false);

  const desktopMode = isDesktopApp();
  const isFloatingOpen = desktopMode ? desktopWidgetOpen : Boolean(pipHandle);

  useEffect(() => {
    void hydrateFromServer();
  }, [hydrateFromServer]);

  useEffect(() => {
    const cleanupSync = initMainSyncHost();
    let cleanupWidget = () => {};

    if (desktopMode && window.tempoDesktop) {
      void window.tempoDesktop.isWidgetOpen().then(setDesktopWidgetOpen);
      cleanupWidget = window.tempoDesktop.onWidgetStateChange(setDesktopWidgetOpen);
    }

    return () => {
      cleanupSync();
      cleanupWidget();
    };
  }, [desktopMode]);

  const closePip = useCallback(() => {
    if (desktopMode && window.tempoDesktop) {
      void window.tempoDesktop.closeWidget();
      return;
    }
    setPipHandle((prev) => {
      prev?.close();
      return null;
    });
  }, [desktopMode]);

  const openPip = useCallback(async () => {
    if (desktopMode && window.tempoDesktop) {
      await window.tempoDesktop.openWidget();
      return;
    }
    if (pipHandle) {
      pipHandle.win.focus();
      return;
    }
    const handle = await openFloatingTimerWindow(() => {
      setPipHandle(null);
    });
    if (handle) {
      setPipHandle(handle);
    }
  }, [desktopMode, pipHandle]);

  const togglePip = useCallback(async () => {
    if (isFloatingOpen) {
      closePip();
    } else {
      await openPip();
    }
  }, [isFloatingOpen, closePip, openPip]);

  useEffect(() => {
    return () => {
      pipHandle?.close();
    };
  }, [pipHandle]);

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] pl-15 text-neutral-900 lg:pl-0">
      {/* Left Soundscape Sidebar & Bottom-Left Sound Pill */}
      <AmbientBar />

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-1 flex-col justify-between px-6 py-6">
        {/* Minimal Centered Mode Selector */}
        <header className="mx-auto flex w-full justify-center">
          <ModeSelector />
        </header>

        {/* Main Centered Workspace */}
        <main className="mx-auto my-auto flex w-full max-w-xl flex-col items-center gap-6 py-4">
          <TimerDisplay
            isPipOpen={isFloatingOpen}
            onStart={startOrResume}
            onTogglePip={togglePip}
          />
        </main>

        {/* Spacer to keep Timer vertically centered */}
        <div className="h-10" aria-hidden="true" />
      </div>

      {/* Subtle Bottom-Right Brand Watermark */}
      <div className="fixed right-6 bottom-5 z-10">
        <TimoLogo className="opacity-25 transition-opacity duration-300 hover:opacity-75" />
      </div>

      {/* Portal into Web Floating PiP / Popup Window */}
      {pipHandle &&
        createPortal(
          <FloatingPipView onClosePip={closePip} />,
          pipHandle.container,
        )}
    </div>
  );
}

export default App;
