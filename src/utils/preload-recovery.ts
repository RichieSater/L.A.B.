import { APP_BUILD_VERSION } from '../constants/build';

const PRELOAD_RECOVERY_KEY_PREFIX = 'lab-preload-recovery:';

interface PreloadRecoveryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface PreloadRecoveryOptions {
  href: string;
  buildVersion?: string;
  storage: PreloadRecoveryStorage;
  reload: () => void;
  preventDefault: () => void;
}

export function getPreloadRecoveryKey(
  href: string,
  buildVersion = APP_BUILD_VERSION,
): string {
  return `${PRELOAD_RECOVERY_KEY_PREFIX}${buildVersion}:${href}`;
}

export function recoverFromPreloadError({
  href,
  buildVersion,
  storage,
  reload,
  preventDefault,
}: PreloadRecoveryOptions): boolean {
  const key = getPreloadRecoveryKey(href, buildVersion);

  if (storage.getItem(key)) {
    return false;
  }

  preventDefault();
  storage.setItem(key, '1');
  reload();
  return true;
}

export function installVitePreloadRecovery(target: Window = window): void {
  target.addEventListener('vite:preloadError', event => {
    recoverFromPreloadError({
      href: target.location.href,
      buildVersion: APP_BUILD_VERSION,
      storage: target.sessionStorage,
      reload: () => target.location.reload(),
      preventDefault: () => event.preventDefault(),
    });
  });
}
