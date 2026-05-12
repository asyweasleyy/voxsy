/**
 * E2E navigation routing tests — ASY-29
 *
 * Verifies that RootNavigator renders the correct stack based on auth state,
 * and never stays stuck on the loading spinner.
 */

jest.mock('../src/hooks/useAuth');
jest.mock('../src/navigation/AuthStack', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => React.createElement(Text, { testID: 'auth-stack' }, 'AuthStack') };
});
jest.mock('../src/navigation/MainTabs', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => React.createElement(Text, { testID: 'main-tabs' }, 'MainTabs') };
});

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import RootNavigator from '../src/navigation/RootNavigator';
import { useAuth } from '../src/hooks/useAuth';

const mockUseAuth = useAuth as jest.Mock;

describe('RootNavigator — page routing', () => {
  it('shows loading spinner while auth is resolving', () => {
    mockUseAuth.mockReturnValue({ session: null, user: null, loading: true });

    const { getByTestId, queryByTestId } = render(<RootNavigator />);

    expect(getByTestId('loading-spinner')).toBeTruthy();
    expect(queryByTestId('auth-stack')).toBeNull();
    expect(queryByTestId('main-tabs')).toBeNull();
  });

  it('shows AuthStack when loading=false and no session', async () => {
    mockUseAuth.mockReturnValue({ session: null, user: null, loading: false });

    const { getByTestId, queryByTestId } = render(<RootNavigator />);

    await waitFor(() => expect(getByTestId('auth-stack')).toBeTruthy());
    expect(queryByTestId('loading-spinner')).toBeNull();
    expect(queryByTestId('main-tabs')).toBeNull();
  });

  it('shows MainTabs when loading=false and session exists', async () => {
    const fakeSession = { user: { id: '123', email: 'test@voxsy.com' } };
    mockUseAuth.mockReturnValue({ session: fakeSession, user: fakeSession.user, loading: false });

    const { getByTestId, queryByTestId } = render(<RootNavigator />);

    await waitFor(() => expect(getByTestId('main-tabs')).toBeTruthy());
    expect(queryByTestId('loading-spinner')).toBeNull();
    expect(queryByTestId('auth-stack')).toBeNull();
  });

  it('never stays on loading screen — transitions within 3s (ASY-29 acceptance)', async () => {
    mockUseAuth.mockReturnValue({ session: null, user: null, loading: false });

    const start = Date.now();
    const { getByTestId } = render(<RootNavigator />);

    await waitFor(() => expect(getByTestId('auth-stack')).toBeTruthy(), { timeout: 3000 });
    expect(Date.now() - start).toBeLessThan(3000);
  });
});
