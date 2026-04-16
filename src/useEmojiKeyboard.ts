import { useRef } from 'react';
import type { SystemEmojiPickerHandle } from './SystemEmojiPicker';

/**
 * Controller object returned by `useEmojiKeyboard`.
 */
export interface EmojiKeyboardController {
  /**
   * Ref to pass to `<SystemEmojiPicker ref={emojiKeyboard.ref} />`.
   */
  ref: React.RefObject<SystemEmojiPickerHandle | null>;
  /** Opens the emoji keyboard. */
  open: () => void;
  /** Dismisses the emoji keyboard (if visible). */
  dismiss: () => void;
}

/**
 * Hook that provides a clean controller API for `<SystemEmojiPicker>`.
 *
 * On iOS `open()` shows the system emoji keyboard.
 * On Android `open()` shows the native emoji picker dialog.
 *
 * @example
 * ```tsx
 * const emojiKeyboard = useEmojiKeyboard();
 *
 * <Button onPress={emojiKeyboard.open} title="Pick emoji" />
 * <Button onPress={emojiKeyboard.dismiss} title="Dismiss" />
 *
 * <SystemEmojiPicker
 *   ref={emojiKeyboard.ref}
 *   onEmojiSelected={(emoji) => console.log(emoji)}
 * />
 * ```
 */
export function useEmojiKeyboard(): EmojiKeyboardController {
  const ref = useRef<SystemEmojiPickerHandle>(null);
  return {
    ref,
    open: () => ref.current?.open(),
    dismiss: () => ref.current?.dismiss(),
  };
}
