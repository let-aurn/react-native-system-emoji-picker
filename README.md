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
        onPress={() => pickerRef.current?.focus()}
      />

      <SystemEmojiPicker
        ref={pickerRef}
        onEmojiSelected={(emoji) => {
          console.log('Selected emoji:', emoji);
        }}
        onOpen={() => {
          console.log('Emoji keyboard opened');
        }}
        onClose={() => {
          console.log('Emoji keyboard closed');
        }}
        autoHideAfterSelection
      />
    </View>
  );
}
```

---

## API

### `<SystemEmojiPicker>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onEmojiSelected` | `(emoji: string) => void` | — | Fired each time the user selects an emoji. The `emoji` string may be a multi-codepoint sequence (family emoji, skin-tone variants, etc.). |
| `onOpen` | `() => void` | — | Fired when the emoji keyboard appears. |
| `onClose` | `() => void` | — | Fired when the emoji keyboard is dismissed. |
| `autoHideAfterSelection` | `boolean` | `false` | Automatically dismiss the keyboard after an emoji is selected. |
| `style` | `StyleProp<ViewStyle>` | — | Optional style overrides. The component renders with zero dimensions by default. |

### `SystemEmojiPickerHandle` (ref)

```ts
interface SystemEmojiPickerHandle {
  /** Opens the emoji keyboard. */
  focus: () => void;
  /** Dismisses the emoji keyboard (if visible). */
  blur: () => void;
}
```

---

## How it works

1. A hidden `UITextField` is added as a subview with a zero frame.
2. Its `keyboardType` is set to `UIKeyboardType(rawValue: 124)` — a publicly accessible enum case that selects the emoji keyboard.
3. Calling `focus()` makes the text field the first responder, which causes iOS to present the emoji keyboard.
4. `UITextFieldDelegate.textField(_:shouldChangeCharactersIn:replacementString:)` intercepts each emoji tap and forwards it to JavaScript. The text field is always kept empty (the method returns `false`) so it behaves purely as a picker.
5. `UIResponder.keyboardWillShow/Hide` notifications drive the `onOpen` / `onClose` events.

### What is NOT used

- No private APIs
- No private selectors
- No `setForceDisableDictation:`
- No method swizzling
- No runtime tricks

---

## Example app

See [`example/App.tsx`](./example/App.tsx) for a self-contained demo inside a full React Native template (iOS and Android projects are included under `example/ios` and `example/android`).

To run it:

```sh
cd example
npm install
bundle install
cd ios && bundle exec pod install && cd ..
npm run ios   # or: npm run android
```

If you see `can't find gem cocoapods ... executable pod`, run `bundle install` in `example` and retry `bundle exec pod install`.

---

## License

MIT
