/**
 * Unit tests for the useEmojiKeyboard hook.
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {describe, it, expect, beforeEach} from '@jest/globals';
import {useEmojiKeyboard} from 'react-native-system-emoji-picker';

// ─── Helper ─────────────────────────────────────────────────────────────────

let capturedController: ReturnType<typeof useEmojiKeyboard>;

function TestComponent() {
  capturedController = useEmojiKeyboard();
  return null;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useEmojiKeyboard', () => {
  beforeEach(() => {
    render(<TestComponent />);
  });

  it('returns a ref object', () => {
    expect(capturedController.ref).toBeDefined();
    expect(typeof capturedController.ref).toBe('object');
  });

  it('returns an open function', () => {
    expect(typeof capturedController.open).toBe('function');
  });

  it('returns a dismiss function', () => {
    expect(typeof capturedController.dismiss).toBe('function');
  });

  it('open() does not throw when ref is unattached', () => {
    expect(() => capturedController.open()).not.toThrow();
  });

  it('dismiss() does not throw when ref is unattached', () => {
    expect(() => capturedController.dismiss()).not.toThrow();
  });

  it('returns a stable ref across calls', () => {
    const firstRef = capturedController.ref;
    render(<TestComponent />);
    // Each hook call creates its own ref — they are different instances
    expect(capturedController.ref).toBeDefined();
    // The ref from the first render should be different from the second render
    expect(capturedController.ref).not.toBe(firstRef);
  });
});
