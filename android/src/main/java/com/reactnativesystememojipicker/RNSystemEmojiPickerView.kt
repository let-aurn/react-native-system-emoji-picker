package com.reactnativesystememojipicker

import android.app.Activity
import android.app.Dialog
import android.content.Context
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.GradientDrawable
import android.view.ContextThemeWrapper
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import androidx.core.view.doOnLayout
import androidx.emoji2.emojipicker.EmojiPickerView
import androidx.emoji2.emojipicker.RecentEmojiProvider
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.RCTEventEmitter
import kotlin.Unit
import kotlin.jvm.functions.Function1

class RNSystemEmojiPickerView(
  reactContext: ReactContext,
) : FrameLayout(reactContext) {

  var autoHideAfterSelection: Boolean = false
  var dismissOnTapOutside: Boolean = false
  var keyboardAppearance: String? = null

  private var dialog: Dialog? = null
  private var isRecentSectionVisible = true
  private var hiddenRecentRange: IntRange? = null
  private var headerAttachListener: RecyclerView.OnChildAttachStateChangeListener? = null
  private var bodyAttachListener: RecyclerView.OnChildAttachStateChangeListener? = null
  private var bodyClampScrollListener: RecyclerView.OnScrollListener? = null

  fun open() {
    val activity = resolveActivity() ?: return

    if (dialog?.isShowing == true) {
      return
    }

    resetRecentSectionPresentationState()

    val colorScheme = resolveColorScheme()
    val themedContext = ContextThemeWrapper(activity, colorScheme.dialogThemeResId)
    val dialogHeight = calculateDialogHeight()
    val pickerView = EmojiPickerView(themedContext).apply {
      layoutParams = LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        dialogHeight,
      )
      setBackgroundColor(colorScheme.surfaceColor)
      setOnEmojiPickedListener { item ->
        if (!isRecentSectionVisible) {
          restoreRecentSectionPresentation(this)
        }

        emitEvent(RNSystemEmojiPickerViewManager.EVENT_EMOJI_SELECTED) {
          putString("emoji", item.emoji)
        }

        if (autoHideAfterSelection) {
          dismiss()
        }
      }
      setRecentEmojiProvider(
        ObservingRecentEmojiProvider(
          delegate = SharedPreferencesRecentEmojiProvider(themedContext),
          onRecentEmojiListLoaded = { recentEmoji ->
            post {
              post {
                syncRecentSectionVisibility(this, recentEmoji.isNotEmpty())
              }
            }
          },
        ),
      )
    }

    val container = FrameLayout(themedContext).apply {
      val inset = dpToPx(8)
      setPadding(inset, inset, inset, inset)
      background = createDialogBackground(colorScheme)
      addView(
        pickerView,
        LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          dialogHeight,
        ),
      )
    }

    pickerView.doOnLayout {
      syncRecentSectionVisibility(
        pickerView = pickerView,
        hasRecentEmoji = getRecentItems(pickerView).isNotEmpty(),
      )
    }

    dialog = Dialog(themedContext).apply {
      setContentView(container)
      setCancelable(true)
      setCanceledOnTouchOutside(dismissOnTapOutside)
      window?.apply {
        setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
        setGravity(Gravity.BOTTOM)
        clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
        setDimAmount(0f)
        setWindowAnimations(R.style.RNSystemEmojiPickerDialogAnimation)
        setLayout(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.WRAP_CONTENT,
        )
      }
      setOnShowListener {
        emitEvent(RNSystemEmojiPickerViewManager.EVENT_OPEN)
      }
      setOnDismissListener {
        dialog = null
        emitEvent(RNSystemEmojiPickerViewManager.EVENT_CLOSE)
      }
      show()
    }
  }

  fun dismiss() {
    dialog?.dismiss()
    resetRecentSectionPresentationState()
  }

  fun cleanup() {
    dismiss()
  }

  private fun resolveActivity(): Activity? {
    val contextActivity = context as? Activity
    if (contextActivity != null && !contextActivity.isFinishing) {
      return contextActivity
    }

    val currentActivity = (context as? ReactContext)?.currentActivity
    if (currentActivity != null && !currentActivity.isFinishing) {
      return currentActivity
    }

    return null
  }

  private fun calculateDialogHeight(): Int {
    val screenHeight = resources.displayMetrics.heightPixels
    val preferredHeight = (screenHeight * 0.42f).toInt()
    val minimumHeight = (resources.displayMetrics.density * 280).toInt()
    return maxOf(preferredHeight, minimumHeight)
  }

  private fun resolveColorScheme(): PickerColorScheme {
    return when (keyboardAppearance?.lowercase()) {
      "light" -> PickerColorScheme.LIGHT
      "dark" -> PickerColorScheme.DARK
      else -> {
        val isDarkMode =
          resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK ==
            Configuration.UI_MODE_NIGHT_YES

        if (isDarkMode) PickerColorScheme.DARK else PickerColorScheme.LIGHT
      }
    }
  }

  private fun createDialogBackground(colorScheme: PickerColorScheme): GradientDrawable {
    return GradientDrawable().apply {
      shape = GradientDrawable.RECTANGLE
      cornerRadii = floatArrayOf(
        dpToPx(20).toFloat(), dpToPx(20).toFloat(),
        dpToPx(20).toFloat(), dpToPx(20).toFloat(),
        0f, 0f,
        0f, 0f,
      )
      setColor(colorScheme.surfaceColor)
      setStroke(dpToPx(1), colorScheme.borderColor)
    }
  }

  private fun syncRecentSectionVisibility(
    pickerView: EmojiPickerView,
    hasRecentEmoji: Boolean,
  ) {
    if (hasRecentEmoji) {
      restoreRecentSectionPresentation(pickerView)
      return
    }

    if (!isRecentSectionVisible) {
      return
    }

    val recentRange = getRecentGroupRange(pickerView) ?: return
    hideRecentSectionPresentation(pickerView, recentRange)
  }

  private fun hideRecentSectionPresentation(
    pickerView: EmojiPickerView,
    recentRange: IntRange,
  ) {
    val recyclerViews = resolvePickerRecyclerViews(pickerView) ?: return
    val headerRecyclerView = recyclerViews.first
    val bodyRecyclerView = recyclerViews.second
    val bodyLayoutManager = bodyRecyclerView.layoutManager as? GridLayoutManager ?: return
    val firstNonRecentPosition = recentRange.last + 1

    hiddenRecentRange = recentRange
    isRecentSectionVisible = false

    if (headerAttachListener == null) {
      headerAttachListener = object : RecyclerView.OnChildAttachStateChangeListener {
        override fun onChildViewAttachedToWindow(view: View) {
          val position = headerRecyclerView.getChildViewHolder(view).bindingAdapterPosition
          setViewHidden(view, position == 0)
        }

        override fun onChildViewDetachedFromWindow(view: View) {
        }
      }
      headerRecyclerView.addOnChildAttachStateChangeListener(headerAttachListener!!)
    }

    if (bodyAttachListener == null) {
      bodyAttachListener = object : RecyclerView.OnChildAttachStateChangeListener {
        override fun onChildViewAttachedToWindow(view: View) {
          val position = bodyRecyclerView.getChildViewHolder(view).bindingAdapterPosition
          setViewHidden(view, recentRange.contains(position))
        }

        override fun onChildViewDetachedFromWindow(view: View) {
        }
      }
      bodyRecyclerView.addOnChildAttachStateChangeListener(bodyAttachListener!!)
    }

    if (bodyClampScrollListener == null) {
      bodyClampScrollListener = object : RecyclerView.OnScrollListener() {
        override fun onScrolled(recyclerView: RecyclerView, dx: Int, dy: Int) {
          super.onScrolled(recyclerView, dx, dy)

          val firstVisiblePosition = bodyLayoutManager.findFirstVisibleItemPosition()
          if (firstVisiblePosition in 0 until firstNonRecentPosition) {
            bodyLayoutManager.scrollToPositionWithOffset(firstNonRecentPosition, 0)
          }
        }
      }
      bodyRecyclerView.addOnScrollListener(bodyClampScrollListener!!)
    }

    updateAttachedChildVisibility(headerRecyclerView) { position -> position == 0 }
    updateAttachedChildVisibility(bodyRecyclerView) { position -> recentRange.contains(position) }
    bodyRecyclerView.post {
      bodyLayoutManager.scrollToPositionWithOffset(firstNonRecentPosition, 0)
      updateAttachedChildVisibility(bodyRecyclerView) { position -> recentRange.contains(position) }
    }
  }

  private fun restoreRecentSectionPresentation(pickerView: EmojiPickerView) {
    if (isRecentSectionVisible) {
      return
    }

    val recyclerViews = resolvePickerRecyclerViews(pickerView) ?: run {
      resetRecentSectionPresentationState()
      return
    }

    val headerRecyclerView = recyclerViews.first
    val bodyRecyclerView = recyclerViews.second

    headerAttachListener?.let(headerRecyclerView::removeOnChildAttachStateChangeListener)
    bodyAttachListener?.let(bodyRecyclerView::removeOnChildAttachStateChangeListener)
    bodyClampScrollListener?.let(bodyRecyclerView::removeOnScrollListener)

    updateAttachedChildVisibility(headerRecyclerView) { false }
    updateAttachedChildVisibility(bodyRecyclerView) { false }

    resetRecentSectionPresentationState()
  }

  private fun resolvePickerRecyclerViews(
    pickerView: EmojiPickerView,
  ): Pair<RecyclerView, RecyclerView>? {
    val headerViewId = getEmojiPickerViewId("emoji_picker_header")
    val bodyViewId = getEmojiPickerViewId("emoji_picker_body")
    if (headerViewId == null || bodyViewId == null) {
      return null
    }

    val headerRecyclerView = pickerView.findViewById<RecyclerView>(headerViewId)
    val bodyRecyclerView = pickerView.findViewById<RecyclerView>(bodyViewId)
    if (headerRecyclerView == null || bodyRecyclerView == null) {
      return null
    }

    return headerRecyclerView to bodyRecyclerView
  }

  private fun updateAttachedChildVisibility(
    recyclerView: RecyclerView,
    shouldHidePosition: (Int) -> Boolean,
  ) {
    for (index in 0 until recyclerView.childCount) {
      val child = recyclerView.getChildAt(index)
      val position = recyclerView.getChildViewHolder(child).bindingAdapterPosition
      setViewHidden(child, shouldHidePosition(position))
    }
  }

  private fun setViewHidden(view: View, hidden: Boolean) {
    val targetVisibility = if (hidden) View.GONE else View.VISIBLE
    if (view.visibility != targetVisibility) {
      view.visibility = targetVisibility
      view.requestLayout()
    }
  }

  private fun getRecentGroupRange(pickerView: EmojiPickerView): IntRange? {
    val currentItems = getEmojiPickerItems(pickerView) ?: return null
    val recentItemGroup = getRecentItemGroup(pickerView) ?: return null
    val method = currentItems.javaClass.methods.firstOrNull {
      it.name == GROUP_RANGE_METHOD && it.parameterTypes.size == 1
    } ?: return null

    return method.invoke(currentItems, recentItemGroup) as? IntRange
  }

  private fun getEmojiPickerItems(pickerView: EmojiPickerView): Any? {
    return invokeStaticEmojiPickerMethod(GET_EMOJI_PICKER_ITEMS_METHOD, pickerView)
  }

  private fun getRecentItemGroup(pickerView: EmojiPickerView): Any? {
    return invokeStaticEmojiPickerMethod(GET_RECENT_ITEM_GROUP_METHOD, pickerView)
  }

  private fun resetRecentSectionPresentationState() {
    isRecentSectionVisible = true
    hiddenRecentRange = null
    headerAttachListener = null
    bodyAttachListener = null
    bodyClampScrollListener = null
  }

  private fun dpToPx(value: Int): Int {
    return (value * resources.displayMetrics.density).toInt()
  }

  private fun getEmojiPickerViewId(name: String): Int? {
    return try {
      val idsClass = Class.forName(EMOJI_PICKER_IDS_CLASS)
      idsClass.getField(name).getInt(null)
    } catch (_: ReflectiveOperationException) {
      null
    }
  }

  @Suppress("UNCHECKED_CAST")
  private fun getRecentItems(pickerView: EmojiPickerView): List<Any> {
    return (invokeStaticEmojiPickerMethod(GET_RECENT_ITEMS_METHOD, pickerView) as? List<Any>).orEmpty()
  }

  private fun invokeStaticEmojiPickerMethod(methodName: String, vararg args: Any?): Any? {
    val method = EmojiPickerView::class.java.methods.firstOrNull {
      it.name == methodName && it.parameterTypes.size == args.size
    } ?: return null

    return method.invoke(null, *args)
  }

  private fun emitEvent(eventName: String, block: (WritableMap.() -> Unit)? = null) {
    val payload = Arguments.createMap().apply {
      block?.invoke(this)
    }

    (context as ReactContext)
      .getJSModule(RCTEventEmitter::class.java)
      .receiveEvent(id, eventName, payload)
  }

  private enum class PickerColorScheme(
    val dialogThemeResId: Int,
    val surfaceColor: Int,
    val borderColor: Int,
  ) {
    LIGHT(
      dialogThemeResId = android.R.style.Theme_DeviceDefault_Light,
      surfaceColor = Color.parseColor("#FFF8F7F4"),
      borderColor = Color.parseColor("#1F1B1612"),
    ),
    DARK(
      dialogThemeResId = android.R.style.Theme_DeviceDefault,
      surfaceColor = Color.parseColor("#FF1C1B1F"),
      borderColor = Color.parseColor("#33FFFFFF"),
    ),
  }

  private class SharedPreferencesRecentEmojiProvider(
    context: Context,
  ) : RecentEmojiProvider {
    private val preferences =
      context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

    override suspend fun getRecentEmojiList(): List<String> {
      return readRecentEmoji()
    }

    override fun recordSelection(emoji: String) {
      val recentEmoji = readRecentEmoji().toMutableList().apply {
        remove(emoji)
        add(0, emoji)
      }.take(MAX_RECENT_EMOJI)

      preferences.edit().putString(PREFERENCES_KEY_RECENT_EMOJI, recentEmoji.joinToString(RECENT_EMOJI_SEPARATOR)).apply()
    }

    private fun readRecentEmoji(): List<String> {
      val rawValue = preferences.getString(PREFERENCES_KEY_RECENT_EMOJI, null).orEmpty()
      if (rawValue.isEmpty()) {
        return emptyList()
      }

      return rawValue
        .split(RECENT_EMOJI_SEPARATOR)
        .filter { it.isNotEmpty() }
    }
  }

  private class ObservingRecentEmojiProvider(
    private val delegate: RecentEmojiProvider,
    private val onRecentEmojiListLoaded: (List<String>) -> Unit,
  ) : RecentEmojiProvider {
    override suspend fun getRecentEmojiList(): List<String> {
      return delegate.getRecentEmojiList().also(onRecentEmojiListLoaded)
    }

    override fun recordSelection(emoji: String) {
      delegate.recordSelection(emoji)
    }
  }

  private companion object {
    private const val EMOJI_PICKER_IDS_CLASS = "androidx.emoji2.emojipicker.R\$id"
    private const val GET_EMOJI_PICKER_ITEMS_METHOD = "access\$getEmojiPickerItems\$p"
    private const val GET_RECENT_ITEMS_METHOD = "access\$getRecentItems\$p"
    private const val GET_RECENT_ITEM_GROUP_METHOD = "access\$getRecentItemGroup\$p"
    private const val GROUP_RANGE_METHOD = "groupRange"
    private const val MAX_RECENT_EMOJI = 27
    private const val PREFERENCES_KEY_RECENT_EMOJI = "recent_emoji"
    private const val PREFERENCES_NAME = "react_native_system_emoji_picker"
    private const val RECENT_EMOJI_SEPARATOR = "\u001F"
  }
}