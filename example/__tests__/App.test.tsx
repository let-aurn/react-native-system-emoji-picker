/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import {describe, it, expect} from '@jest/globals';

import {fireEvent, render} from '@testing-library/react-native';

describe('App', () => {
  it('renders correctly', () => {
    render(<App />);
  });

  it('toggles keyboard appearance text between light and dark', () => {
    const screen = render(<App />);

    expect(screen.getByText('Appearance: light')).toBeTruthy();

    fireEvent.press(screen.getByText('Dark mode'));
    expect(screen.getByText('Appearance: dark')).toBeTruthy();

    fireEvent.press(screen.getByText('Light mode'));
    expect(screen.getByText('Appearance: light')).toBeTruthy();
  });
});

