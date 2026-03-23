import React, {useState} from 'react';
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  KeyboardAppearance,
  SystemEmojiPicker,
  useEmojiKeyboard,
} from 'react-native-system-emoji-picker';

export default function App() {
  const emojiKeyboard = useEmojiKeyboard();
  const [lastEmoji, setLastEmoji] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('closed');
  const [keyboardAppearance, setKeyboardAppearance] =
    useState<KeyboardAppearance>('light');
  const isDarkMode = keyboardAppearance === 'dark';

  return (
    <SafeAreaView
      style={[
        styles.container,
        isDarkMode ? styles.containerDark : styles.containerLight,
      ]}>
      <KeyboardAvoidingView
        style={[
          styles.inner,
          isDarkMode ? styles.innerDark : styles.innerLight,
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <Text
          style={[
            styles.title,
            isDarkMode ? styles.titleDark : styles.titleLight,
          ]}>
          react-native-system-emoji-picker
        </Text>

        {lastEmoji != null && <Text style={styles.emoji}>{lastEmoji}</Text>}

        <Text
          style={[
            styles.status,
            isDarkMode ? styles.statusDark : styles.statusLight,
          ]}>
          Keyboard: {status}
        </Text>
        <Text
          style={[
            styles.status,
            isDarkMode ? styles.statusDark : styles.statusLight,
          ]}>
          Appearance: {keyboardAppearance}
        </Text>

        <View style={styles.buttonRow}>
          <Button title="Pick emoji" onPress={emojiKeyboard.open} />
          <Button title="Dismiss" onPress={emojiKeyboard.dismiss} />
        </View>

        <View style={styles.buttonRow}>
          <Button
            title="Keyboard in light mode"
            onPress={() => setKeyboardAppearance('light')}
          />
          <Button
            title="Keyboard in dark mode"
            onPress={() => setKeyboardAppearance('dark')}
          />
        </View>

        <SystemEmojiPicker
          ref={emojiKeyboard.ref}
          keyboardAppearance={keyboardAppearance}
          onEmojiSelected={emoji => {
            console.log('Selected emoji:', emoji);
            setLastEmoji(emoji);
          }}
          onOpen={() => {
            console.log('Emoji keyboard opened');
            setStatus('open');
          }}
          onClose={() => {
            console.log('Emoji keyboard closed');
            setStatus('closed');
          }}
          autoHideAfterSelection
          dismissOnTapOutside
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerLight: {
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#111',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerLight: {
    backgroundColor: '#fff',
  },
  innerDark: {
    backgroundColor: '#111',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  titleLight: {
    color: '#111',
  },
  titleDark: {
    color: '#f5f5f5',
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  status: {
    fontSize: 14,
    marginBottom: 24,
  },
  statusLight: {
    color: '#666',
  },
  statusDark: {
    color: '#ccc',
  },
  buttonRow: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 16,
  },
});
