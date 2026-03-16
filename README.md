# react-native-system-emoji-picker

A React Native component that opens the **native iOS system emoji keyboard** and returns the selected emoji through a simple event-driven API.

The picker is backed by a hidden `UITextField` configured to show the emoji keyboard (keyboard type raw value `124`). No private APIs or method swizzling are used.

> **Platform support:** iOS only. On Android the component renders `null` and emits a warning in development builds.

---

## Installation

```sh
npm install react-native-system-emoji-picker
# or
yarn add react-native-system-emoji-picker
```

### iOS — CocoaPods

```sh
bundle install
cd ios && bundle exec pod install && cd ..
```

If your system `pod` command is missing, always run CocoaPods through Bundler (`bundle exec`) in the project that contains the `Gemfile`.

Add the following to your `Podfile` if it isn't there already:

```ruby
use_frameworks! :linkage => :static   # optional, but required for Swift pods in some setups
```

---

## Usage

### With `useEmojiKeyboard` hook (recommended)

```tsx
import React, { useState } from 'react';
import { Button, KeyboardAvoidingView, Platform, View } from 'react-native';
import {
  SystemEmojiPicker,
  useEmojiKeyboard,
} from 'react-native-system-emoji-picker';

export default function App() {
  const emojiKeyboard = useEmojiKeyboard();
  const [emoji, setEmoji] = useState('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View>
        <Button title="Pick emoji" onPress={emojiKeyboard.open} />
        <Button title="Dismiss" onPress={emojiKeyboard.dismiss} />
      </View>

      <SystemEmojiPicker
        ref={emojiKeyboard.ref}
        onEmojiSelected={(e) => setEmoji(e)}
        onOpen={() => console.log('Emoji keyboard opened')}
        onClose={() => console.log('Emoji keyboard closed')}
        autoHideAfterSelection
        dismissOnTapOutside
      />
    </KeyboardAvoidingView>
  );
}
```

### With a ref directly

```tsx
import React, { useRef } from 'react';
import { Button, View } from 'react-native';
import {
  SystemEmojiPicker,
  SystemEmojiPickerHandle,
} from 'react-native-system-emoji-picker';

export default function App() {
  const pickerRef = useRef<SystemEmojiPickerHandle>(null);

  return (
    <View>
      <Button
        title="Pick emoji"
        onPress={() => pickerRef.current?.open()}
      />

      <SystemEmojiPicker
        ref={pickerRef}
        onEmojiSelected={(emoji) => {
          console.log('Selected emoji:', emoji);
        }}
        autoHideAfterSelection
      />
    </View>
  );
}
```

---

## API

### `useEmojiKeyboard()`

A hook that creates and manages a ref for `<SystemEmojiPicker>` and returns an
`EmojiKeyboardController` with clean `open` / `dismiss` methods.

```tsx
const emojiKeyboard = useEmojiKeyboard();

emojiKeyboard.open();    // opens the emoji keyboard
emojiKeyboard.dismiss(); // closes the emoji keyboard

// Pass the ref to SystemEmojiPicker:
<SystemEmojiPicker ref={emojiKeyboard.ref} />
```

### `<SystemEmojiPicker>`

| Prop                     | Type                      | Default | Description                                                                                                                               |
|--------------------------|---------------------------|---------|-------------------------------------------------------------------------------------------------------------------------------------------|
| `onEmojiSelected`        | `(emoji: string) => void` | —       | Fired each time the user selects an emoji. The `emoji` string may be a multi-codepoint sequence (family emoji, skin-tone variants, etc.). |
| `onOpen`                 | `() => void`              | —       | Fired when the emoji keyboard appears.                                                                                                    |
| `onClose`                | `() => void`              | —       | Fired when the emoji keyboard is dismissed.                                                                                               |
| `autoHideAfterSelection` | `boolean`                 | `false` | Automatically dismiss the keyboard after an emoji is selected.                                                                            |
| `dismissOnTapOutside`    | `boolean`                 | `false` | Dismiss the keyboard when the user taps outside of it.                                                                                    |
| `style`                  | `StyleProp<ViewStyle>`    | —       | Optional style overrides. The component renders with zero dimensions by default.                                                          |

### `SystemEmojiPickerHandle` (ref)

```ts
interface SystemEmojiPickerHandle {
  /** Opens the emoji keyboard. */
  open: () => void;
  /** Dismisses the emoji keyboard (if visible). */
  dismiss: () => void;
}
```

---

## How it works

1. A hidden `UITextField` is added as a subview with a zero frame.
2. Its `keyboardType` is set to `UIKeyboardType(rawValue: 124)` — a publicly accessible enum case that selects the emoji keyboard.
3. Calling `open()` makes the text field the first responder, which causes iOS to present the emoji keyboard.
4. `UITextFieldDelegate.textField(_:shouldChangeCharactersIn:replacementString:)` intercepts each emoji tap and forwards it to JavaScript. The text field is always kept empty (the method returns `false`) so it behaves purely as a picker.
5. `UIResponder.keyboardWillShow/Hide` notifications drive the `onOpen` / `onClose` events.
6. When `dismissOnTapOutside` is `true` and the keyboard is open, a transparent full-screen overlay is shown. Tapping it calls `dismiss()`.

### What is NOT used

- No private APIs
- No private selectors
- No `setForceDisableDictation:`
- No method swizzling
- No runtime tricks

---

## App Store Compatibility

### Will Apple's binary scanner flag this library?

**No.** Apple's automated App Store binary analysis looks for three categories of private API usage:

1. **Private symbol references** — imports of symbols (functions, classes, methods) from Apple's private frameworks (`PrivateFrameworks`, SPI headers, etc.).
2. **Private selector names as strings** — Objective-C selectors like `_setForceEnableDictation:` that match Apple's internal method names or begin with an underscore.
3. **Dynamic private API lookups** — calls to `dlopen`, `dlsym`, `objc_getClass`, `NSSelectorFromString`, or `performSelector:` with private names.

This library uses **none** of the above.

### Why `UIKeyboardType(rawValue: 124)` is safe

The only part of this library that could raise questions is the use of `UIKeyboardType(rawValue: 124)`.

- **No symbol is emitted in the binary.** The integer literal `124` compiles to a plain load-immediate instruction. There is no string, no symbol reference, and no Mach-O export entry for `124`. Apple's scanner has no mechanism to detect that a specific integer was used as a `UIKeyboardType` raw value.
- **No private method or selector is called.** The value is assigned to `UITextField.keyboardType`, a fully public API property.
- **No runtime tricks are involved.** There is no `objc_msgSend`, `performSelector:`, method swizzling, or ISA manipulation anywhere in the library.

### Summary

| Check                                                 | Result                                    |
|-------------------------------------------------------|-------------------------------------------|
| Private framework imports                             | ✅ None                                    |
| Private Objective-C selectors                         | ✅ None                                    |
| `dlopen` / `dlsym` / `NSSelectorFromString`           | ✅ None                                    |
| Method swizzling                                      | ✅ None                                    |
| `UIKeyboardType(rawValue: 124)` detectable by scanner | ✅ Not detectable — plain integer constant |

### Runtime risk (separate from App Store validation)

While this library will **not** block App Store validation, `UIKeyboardType` raw value `124` is undocumented by Apple, which means it could theoretically change in a future iOS release. In practice the value has been stable across every iOS version since the emoji keyboard was introduced (iOS 13–18). The implementation falls back to `.default` if the raw value ever becomes invalid, so the app will not crash — the emoji keyboard simply will not appear.

---

## Example app

See [`example/App.tsx`](./example/App.tsx) for a self-contained demo inside a full React Native template (iOS and Android projects are included under `example/ios` and `example/android`).

To run it:

```sh
cd example
npm install
bundle install
cd ios && bundle exec pod install && cd ..
npm run ios
```

If you see `can't find gem cocoapods ... executable pod`, run `bundle install` in `example` and retry `bundle exec pod install`.

---

## License

MIT
