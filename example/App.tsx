import React, { useRef, useState } from 'react';
import {
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SystemEmojiPicker,
  SystemEmojiPickerHandle,
} from 'react-native-system-emoji-picker';

export default function App() {
  const pickerRef = useRef<SystemEmojiPickerHandle>(null);
  const [lastEmoji, setLastEmoji] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('closed');

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>react-native-system-emoji-picker</Text>

      {lastEmoji != null && (
        <Text style={styles.emoji}>{lastEmoji}</Text>
      )}

      <Text style={styles.status}>Keyboard: {status}</Text>

      <View style={styles.buttonRow}>
        <Button
          title="Pick emoji"
          onPress={() => pickerRef.current?.focus()}
        />
        <Button
          title="Dismiss"
          onPress={() => pickerRef.current?.blur()}
        />
      </View>

      <SystemEmojiPicker
        ref={pickerRef}
        onEmojiSelected={(emoji) => {
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
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
