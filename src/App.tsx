import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { AmbientBar } from './components/AmbientBar';
import { FloatingPipView } from './components/FloatingPipView';
import { InsightsDrawer } from './components/InsightsDrawer';
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
  const [insightsOpen, setInsightsOpen] = useState(false);

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
        {/* Minimal Header / Navbar */}
        <header className="mx-auto grid w-full max-w-5xl grid-cols-2 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center justify-self-start pl-3 sm:pl-5">
            <TimoLogo />
          </div>

          <div className="col-span-2 order-last justify-self-center sm:col-span-1 sm:order-none">
            <ModeSelector />
          </div>

          <motion.button
            type="button"
            onClick={() => setInsightsOpen(true)}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.93, y: 1 }}
            transition={{ type: 'spring', stiffness: 450, damping: 24 }}
            className="flex cursor-pointer items-center gap-2 justify-self-end rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-xs transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Log</span>
          </motion.button>
        </header>

        {/* Main Centered Workspace */}
        <main className="mx-auto my-auto flex w-full max-w-md flex-col items-center gap-8 py-6">
          <TimerDisplay
            isPipOpen={isFloatingOpen}
            onStart={startOrResume}
            onTogglePip={togglePip}
          />
        </main>

        {/* Spacer to keep Timer vertically centered */}
        <div className="h-10" aria-hidden="true" />
      </div>

      {/* Log & Insights Drawer */}
      <InsightsDrawer
        open={insightsOpen}
        onClose={() => setInsightsOpen(false)}
      />

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
