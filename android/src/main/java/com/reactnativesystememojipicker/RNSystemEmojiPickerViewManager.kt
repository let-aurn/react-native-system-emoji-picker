package com.reactnativesystememojipicker

import com.facebook.react.common.MapBuilder
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class RNSystemEmojiPickerViewManager : SimpleViewManager<RNSystemEmojiPickerView>() {

  override fun getName(): String {
    return REACT_CLASS
  }

  override fun createViewInstance(reactContext: ThemedReactContext): RNSystemEmojiPickerView {
    return RNSystemEmojiPickerView(reactContext)
  }

  @ReactProp(name = "autoHideAfterSelection", defaultBoolean = false)
  fun setAutoHideAfterSelection(view: RNSystemEmojiPickerView, value: Boolean) {
    view.autoHideAfterSelection = value
  }

  @ReactProp(name = "dismissOnTapOutside", defaultBoolean = false)
  fun setDismissOnTapOutside(view: RNSystemEmojiPickerView, value: Boolean) {
    view.dismissOnTapOutside = value
  }

  @ReactProp(name = "keyboardAppearance")
  fun setKeyboardAppearance(view: RNSystemEmojiPickerView, value: String?) {
    view.keyboardAppearance = value
  }

  override fun getCommandsMap(): MutableMap<String, Int> {
    return MapBuilder.of("focus", COMMAND_FOCUS, "blur", COMMAND_BLUR)
  }

  override fun receiveCommand(root: RNSystemEmojiPickerView, commandId: Int, args: ReadableArray?) {
    when (commandId) {
      COMMAND_FOCUS -> root.open()
      COMMAND_BLUR -> root.dismiss()
    }
  }

  override fun onDropViewInstance(view: RNSystemEmojiPickerView) {
    view.cleanup()
    super.onDropViewInstance(view)
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    return MapBuilder.builder<String, Any>()
      .put(EVENT_EMOJI_SELECTED, MapBuilder.of("registrationName", "onEmojiSelected"))
      .put(EVENT_OPEN, MapBuilder.of("registrationName", "onOpen"))
      .put(EVENT_CLOSE, MapBuilder.of("registrationName", "onClose"))
      .build()
  }

  companion object {
    const val REACT_CLASS = "RNSystemEmojiPickerView"
    const val EVENT_EMOJI_SELECTED = "topEmojiSelected"
    const val EVENT_OPEN = "topOpen"
    const val EVENT_CLOSE = "topClose"

    private const val COMMAND_FOCUS = 1
    private const val COMMAND_BLUR = 2
  }
}