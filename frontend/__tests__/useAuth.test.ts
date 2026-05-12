/**
 * E2E / integration tests for useAuth hook — navigation loading state
 *
 * Covers ASY-29: "Uygulama ayağa kalkıyor ama sayfalar gelmiyor"
 * Root cause: getCurrentSession() rejection left loading=true forever.
 */

jest.mock('../src/services/auth.service', () => ({
  getCurrentSession: jest.fn(),
  onAuthStateChange: jest.fn(() => ({ unsubscribe: jest.fn() })),
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '../src/hooks/useAuth';
import { getCurrentSession, onAuthStateChange } from '../src/services/auth.service';

const mockGetCurrentSession = getCurrentSession as jest.Mock;
const mockOnAuthStateChange = onAuthStateChange as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockOnAuthStateChange.mockReturnValue({ unsubscribe: jest.fn() });
});

describe('useAuth — loading state', () => {
  it('resolves loading=false when session exists', async () => {
    const fakeSession = { user: { id: '123', email: 'test@voxsy.com' } };
    mockGetCurrentSession.mockResolvedValueOnce(fakeSession);

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toEqual(fakeSession);
    expect(result.current.user).toEqual(fakeSession.user);
  });

  it('resolves loading=false when no session (null)', async () => {
    mockGetCurrentSession.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('resolves loading=false even when getCurrentSession throws (ASY-29 fix)', async () => {
    // This was the root cause: rejection left loading=true forever → blank screen
    mockGetCurrentSession.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('updates session on auth state change event', async () => {
    mockGetCurrentSession.mockResolvedValueOnce(null);

    let authChangeCallback: (event: string, session: unknown) => void = () => {};
    mockOnAuthStateChange.mockImplementation((cb) => {
      authChangeCallback = cb;
      return { unsubscribe: jest.fn() };
    });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newSession = { user: { id: '456', email: 'new@voxsy.com' } };
    act(() => authChangeCallback('SIGNED_IN', newSession));

    expect(result.current.session).toEqual(newSession);
    expect(result.current.loading).toBe(false);
  });

  it('unsubscribes from auth listener on unmount', async () => {
    mockGetCurrentSession.mockResolvedValueOnce(null);
    const unsubscribe = jest.fn();
    mockOnAuthStateChange.mockReturnValue({ unsubscribe });

    const { unmount } = renderHook(() => useAuth());
    await waitFor(() => {});
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
