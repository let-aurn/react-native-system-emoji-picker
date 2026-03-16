/**
 * Unit tests for the SystemEmojiPicker component.
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {Platform} from 'react-native';
import {describe, it, expect, jest, beforeEach, afterEach} from '@jest/globals';
import {
  SystemEmojiPicker,
  SystemEmojiPickerHandle,
} from 'react-native-system-emoji-picker';

// In the Jest environment, requireNativeComponent('RNSystemEmojiPickerView')
// renders as a host component with type string 'RNSystemEmojiPickerView'.
const NATIVE_VIEW_TYPE = 'RNSystemEmojiPickerView';
type NodeWithType = {type: unknown};

function isNativeViewType(type: unknown) {
  return type === NATIVE_VIEW_TYPE;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SystemEmojiPicker', () => {
  describe('on Android', () => {
    let originalOS: typeof Platform.OS;

    beforeEach(() => {
      originalOS = Platform.OS;
      Object.defineProperty(Platform, 'OS', {value: 'android'});
    });

    afterEach(() => {
      Object.defineProperty(Platform, 'OS', {value: originalOS});
    });

    it('renders null', () => {
      // Suppress the expected dev warning for this test
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const tree = render(<SystemEmojiPicker />);
      expect(tree.toJSON()).toBeNull();
      spy.mockRestore();
    });
  });

  describe('on iOS', () => {
    it('renders without throwing', () => {
      expect(() => render(<SystemEmojiPicker />)).not.toThrow();
    });

    it('renders the native view', () => {
      const instance = render(<SystemEmojiPicker />);
      const nativeViews = instance.UNSAFE_root.findAll((n: NodeWithType) =>
        isNativeViewType(n.type),
      );
      expect(nativeViews.length).toBeGreaterThan(0);
    });

    it('calls onOpen when the keyboard appears', () => {
      const onOpen = jest.fn();
      const instance = render(<SystemEmojiPicker onOpen={onOpen} />);
      const nativeView = instance.UNSAFE_root.find((n: NodeWithType) =>
        isNativeViewType(n.type),
      );
      nativeView.props.onOpen?.({nativeEvent: {}});
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when the keyboard dismisses', () => {
      const onClose = jest.fn();
      const instance = render(<SystemEmojiPicker onClose={onClose} />);
      const nativeView = instance.UNSAFE_root.find((n: NodeWithType) =>
        isNativeViewType(n.type),
      );
      nativeView.props.onClose?.({nativeEvent: {}});
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onEmojiSelected with the emoji string', () => {
      const onEmojiSelected = jest.fn();
      const instance = render(
        <SystemEmojiPicker onEmojiSelected={onEmojiSelected} />,
      );
      const nativeView = instance.UNSAFE_root.find((n: NodeWithType) =>
        isNativeViewType(n.type),
      );
      nativeView.props.onEmojiSelected?.({nativeEvent: {emoji: '😀'}});
      expect(onEmojiSelected).toHaveBeenCalledWith('😀');
    });

    it('exposes open and dismiss via ref', () => {
      const ref = React.createRef<SystemEmojiPickerHandle>();
      render(<SystemEmojiPicker ref={ref} />);
      expect(typeof ref.current?.open).toBe('function');
      expect(typeof ref.current?.dismiss).toBe('function');
    });

    it('open() and dismiss() do not throw', () => {
      const ref = React.createRef<SystemEmojiPickerHandle>();
      // Suppress expected "missing native command" dev warnings
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(<SystemEmojiPicker ref={ref} />);
      expect(() => ref.current?.open()).not.toThrow();
      expect(() => ref.current?.dismiss()).not.toThrow();
      spy.mockRestore();
    });

    it('passes autoHideAfterSelection prop to native view', () => {
      const instance = render(<SystemEmojiPicker autoHideAfterSelection />);
      const nativeView = instance.UNSAFE_root.find((n: NodeWithType) =>
        isNativeViewType(n.type),
      );
      expect(nativeView.props.autoHideAfterSelection).toBe(true);
    });

    it('passes dismissOnTapOutside prop to native view', () => {
      const instance = render(<SystemEmojiPicker dismissOnTapOutside />);
      const nativeView = instance.UNSAFE_root.find((n: NodeWithType) =>
        isNativeViewType(n.type),
      );
      expect(nativeView.props.dismissOnTapOutside).toBe(true);
    });
  });
});
