import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
} from 'react';
import {
  Platform,
  UIManager,
  findNodeHandle,
  requireNativeComponent,
  StyleSheet,
  View,
  type ViewStyle,
  type StyleProp,
  type HostComponent,
} from 'react-native';

// ---------------------------------------------------------------------------
// Native component name – must match RCT_EXPORT_MODULE in the iOS ViewManager
// ---------------------------------------------------------------------------
const NATIVE_VIEW_NAME = 'RNSystemEmojiPickerView';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Props for the native UIView layer (not the public API).
 * Events arrive as `{ nativeEvent: { ... } }` from the RN bridge.
 */
interface NativeSystemEmojiPickerProps {
  onEmojiSelected?: (event: { nativeEvent: { emoji: string } }) => void;
  onOpen?: (event: { nativeEvent: Record<string, never> }) => void;
  onClose?: (event: { nativeEvent: Record<string, never> }) => void;
  autoHideAfterSelection?: boolean;
  dismissOnTapOutside?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Public props for `<SystemEmojiPicker />`.
 */
export interface SystemEmojiPickerProps {
  /**
   * Called each time the user selects an emoji from the keyboard.
   * The `emoji` parameter contains the selected emoji string (which may be
   * a multi-codepoint sequence such as a family emoji or skin-tone variant).
   */
  onEmojiSelected?: (emoji: string) => void;

  /**
   * Called when the emoji keyboard appears.
   */
  onOpen?: () => void;

  /**
   * Called when the emoji keyboard is dismissed.
   */
  onClose?: () => void;

  /**
   * When `true`, the emoji keyboard is automatically dismissed after the
   * user selects an emoji.  Defaults to `false`.
   */
  autoHideAfterSelection?: boolean;

  /**
   * When `true`, tapping anywhere outside the emoji keyboard dismisses it.
   * Defaults to `false`.
   */
  dismissOnTapOutside?: boolean;

  /**
   * Optional style overrides.  The component renders with zero dimensions by
   * default so that it does not affect layout.
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Imperative handle returned by `useRef<SystemEmojiPickerHandle>()` or
 * by the `useEmojiKeyboard` hook.
 */
export interface SystemEmojiPickerHandle {
  /** Opens the emoji keyboard. */
  open: () => void;
  /** Dismisses the emoji keyboard (if visible). */
  dismiss: () => void;
}

// ---------------------------------------------------------------------------
// Lazy native component — only resolved on iOS
// ---------------------------------------------------------------------------

let NativeView: HostComponent<NativeSystemEmojiPickerProps> | null = null;

if (Platform.OS === 'ios') {
  NativeView = requireNativeComponent<NativeSystemEmojiPickerProps>(
    NATIVE_VIEW_NAME,
  );
}

// ---------------------------------------------------------------------------
// Helper: dispatch a ViewManager command to the native view
// ---------------------------------------------------------------------------
function dispatchCommand(handle: number, commandName: string): void {
  // getViewManagerConfig returns `{ Commands: { focus: 0, blur: 1, … }, … }`
  // The native commands are still named 'focus'/'blur'; JS exposes them as open/dismiss.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mgr = UIManager as any;
  const config =
    typeof mgr.getViewManagerConfig === 'function'
      ? mgr.getViewManagerConfig(NATIVE_VIEW_NAME)
      : null;

  const commandId: number | undefined = config?.Commands?.[commandName];
  if (commandId == null) {
    if (__DEV__) {
      console.warn(
        `react-native-system-emoji-picker: missing native command "${commandName}"`,
      );
    }
    return;
  }
  UIManager.dispatchViewManagerCommand(handle, commandId, []);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * `SystemEmojiPicker` renders a zero-size hidden native view that manages a
 * `UITextField` configured to show the iOS system emoji keyboard.
 *
 * The recommended way to control it is via the `useEmojiKeyboard` hook:
 *
 * ```tsx
 * const emojiKeyboard = useEmojiKeyboard();
 * emojiKeyboard.open();    // opens the keyboard
 * emojiKeyboard.dismiss(); // closes the keyboard
 * ```
 *
 * You can also control it directly with a ref:
 *
 * ```tsx
 * const pickerRef = useRef<SystemEmojiPickerHandle>(null);
 * pickerRef.current?.open();    // opens the keyboard
 * pickerRef.current?.dismiss(); // closes the keyboard
 * ```
 *
 * **iOS only.** On Android the component renders `null` and emits a warning
 * in development builds.
 */
const SystemEmojiPicker = forwardRef<
  SystemEmojiPickerHandle,
  SystemEmojiPickerProps
>(function SystemEmojiPicker(props, ref) {
  const {
    onEmojiSelected,
    onOpen,
    onClose,
    autoHideAfterSelection,
    dismissOnTapOutside,
    style,
  } = props;

  const nativeRef = useRef<React.ElementRef<typeof View>>(null);

  // Expose imperative handle
  useImperativeHandle(
    ref,
    () => ({
      open() {
        if (Platform.OS !== 'ios') return;
        const handle = findNodeHandle(nativeRef.current);
        if (handle == null) return;
        dispatchCommand(handle, 'focus');
      },
      dismiss() {
        if (Platform.OS !== 'ios') return;
        const handle = findNodeHandle(nativeRef.current);
        if (handle == null) return;
        dispatchCommand(handle, 'blur');
      },
    }),
    [],
  );

  // Android: unsupported — render nothing and optionally warn
  if (Platform.OS !== 'ios') {
    if (__DEV__) {
      console.warn(
        'react-native-system-emoji-picker: Android is not supported. ' +
          'The <SystemEmojiPicker> component will render null.',
      );
    }
    return null;
  }

  if (NativeView == null) {
    return null;
  }

  // Event bridge: unwrap nativeEvent and forward to the caller's simpler API
  const handleEmojiSelected = useCallback(
    (event: { nativeEvent: { emoji: string } }) => {
      onEmojiSelected?.(event.nativeEvent.emoji);
    },
    [onEmojiSelected],
  );

  const handleOpen = useCallback(
    (_event: { nativeEvent: Record<string, never> }) => {
      onOpen?.();
    },
    [onOpen],
  );

  const handleClose = useCallback(
    (_event: { nativeEvent: Record<string, never> }) => {
      onClose?.();
    },
    [onClose],
  );

  return (
    <NativeView
      ref={nativeRef as React.Ref<React.ElementRef<typeof NativeView>>}
      style={[styles.hidden, style]}
      onEmojiSelected={handleEmojiSelected}
      onOpen={handleOpen}
      onClose={handleClose}
      autoHideAfterSelection={autoHideAfterSelection}
      dismissOnTapOutside={dismissOnTapOutside}
    />
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  hidden: {
    width: 0,
    height: 0,
    overflow: 'hidden',
  },
});

export default SystemEmojiPicker;
