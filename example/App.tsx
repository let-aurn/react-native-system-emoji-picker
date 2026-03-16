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
  SystemEmojiPicker,
  useEmojiKeyboard,
} from 'react-native-system-emoji-picker';

export default function App() {
  const emojiKeyboard = useEmojiKeyboard();
  const [lastEmoji, setLastEmoji] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('closed');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <Text style={styles.title}>react-native-system-emoji-picker</Text>

        {lastEmoji != null && <Text style={styles.emoji}>{lastEmoji}</Text>}

        <Text style={styles.status}>Keyboard: {status}</Text>

        <View style={styles.buttonRow}>
          <Button title="Pick emoji" onPress={emojiKeyboard.open} />
          <Button title="Dismiss" onPress={emojiKeyboard.dismiss} />
        </View>

        <SystemEmojiPicker
          ref={emojiKeyboard.ref}
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
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
});
