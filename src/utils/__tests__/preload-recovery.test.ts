import { describe, expect, it, vi } from 'vitest';
import {
  getPreloadRecoveryKey,
  installVitePreloadRecovery,
  recoverFromPreloadError,
} from '../preload-recovery';

function createStorage(initialValues?: Record<string, string>) {
  const values = new Map(Object.entries(initialValues ?? {}));

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

describe('recoverFromPreloadError', () => {
  it('reloads once for a URL that has not been recovered yet', () => {
    const storage = createStorage();
    const reload = vi.fn();
    const preventDefault = vi.fn();

    const recovered = recoverFromPreloadError({
      href: 'https://lab.test/settings',
      buildVersion: 'build-a',
      storage,
      reload,
      preventDefault,
    });

    expect(recovered).toBe(true);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(storage.getItem(getPreloadRecoveryKey('https://lab.test/settings', 'build-a'))).toBe('1');
  });

  it('does not reload again after the current URL already recovered once', () => {
    const href = 'https://lab.test/session/career';
    const storage = createStorage({
      [getPreloadRecoveryKey(href, 'build-a')]: '1',
    });
    const reload = vi.fn();
    const preventDefault = vi.fn();

    const recovered = recoverFromPreloadError({
      href,
      buildVersion: 'build-a',
      storage,
      reload,
      preventDefault,
    });

    expect(recovered).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('allows one recovery for the same URL after a later build version', () => {
    const href = 'https://lab.test/advisor/relationships';
    const storage = createStorage({
      [getPreloadRecoveryKey(href, 'build-a')]: '1',
    });
    const reload = vi.fn();
    const preventDefault = vi.fn();

    const recovered = recoverFromPreloadError({
      href,
      buildVersion: 'build-b',
      storage,
      reload,
      preventDefault,
    });

    expect(recovered).toBe(true);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(storage.getItem(getPreloadRecoveryKey(href, 'build-b'))).toBe('1');
  });
});

describe('installVitePreloadRecovery', () => {
  it('registers a vite:preloadError listener that delegates to the recovery logic', () => {
    const storage = createStorage();
    const reload = vi.fn();
    let preloadErrorHandler: ((event: Event) => void) | undefined;

    const fakeWindow = {
      addEventListener(type: string, handler: (event: Event) => void) {
        if (type === 'vite:preloadError') {
          preloadErrorHandler = handler;
        }
      },
      location: {
        href: 'https://lab.test/advisor/fitness',
        reload,
      },
      sessionStorage: storage,
    } as unknown as Window;

    installVitePreloadRecovery(fakeWindow);

    expect(preloadErrorHandler).toBeTypeOf('function');

    const preventDefault = vi.fn();
    preloadErrorHandler?.({ preventDefault } as unknown as Event);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(storage.getItem(getPreloadRecoveryKey('https://lab.test/advisor/fitness'))).toBe('1');
  });
});
