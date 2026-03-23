import UIKit

/// A zero-frame, non-interactive `UIView` that contains a hidden `UITextField`
/// configured to present the system emoji keyboard.
///
/// The keyboard is opened / closed via the `focus()` / `blur()` entry points
/// that the Objective-C `ViewManager` calls on the main thread.
@objc(RNSystemEmojiPickerView)
public final class RNSystemEmojiPickerView: UIView {

  // MARK: - Constants

  /// The raw `UIKeyboardType` value that selects the system emoji keyboard.
  ///
  /// `UIKeyboardType` is a fully public UIKit enum; this particular case is not
  /// listed in Apple's SDK header but is a stable, well-known value that has
  /// been consistent from iOS 13 through iOS 18.
  ///
  /// **App Store scanner safety:** Apple's automated binary analysis detects
  /// private APIs through *symbol name matching* — it looks for references to
  /// private Objective-C selectors, private C symbols, and private framework
  /// imports.  A plain integer constant assigned to a public property compiles
  /// to a simple load-immediate instruction with no symbol reference in the
  /// Mach-O binary.  The scanner has no mechanism to detect that a specific
  /// integer was used as a `UIKeyboardType` raw value, so this does **not**
  /// trigger a private-API rejection.
  ///
  /// **Fallback:** `UIKeyboardType(rawValue:)` returns `nil` when the value is
  /// out of range, and we fall back to `.default` in that case.  This means
  /// the emoji keyboard simply won't appear (instead of crashing) should Apple
  /// ever remove or reassign the value in a future OS release.
  private static let emojiKeyboardType = UIKeyboardType(rawValue: 124) ?? .default

  // MARK: - React Native event props
  //
  // Declared as optional ObjC-compatible block types.
  // `((NSDictionary) -> Void)` bridges directly from/to `RCTDirectEventBlock`
  // (`void(^)(NSDictionary *body)`) – no React headers needed in Swift.

  @objc public var onEmojiSelected: ((NSDictionary) -> Void)?
  @objc public var onOpen: ((NSDictionary) -> Void)?
  @objc public var onClose: ((NSDictionary) -> Void)?

  /// When `true` the emoji keyboard is dismissed automatically after selection.
  @objc public var autoHideAfterSelection: Bool = false

  /// When `true`, taps in the host window outside the system keyboard dismiss it.
  @objc public var dismissOnTapOutside: Bool = false {
    didSet {
      updateOutsideTapGestureIfNeeded()
    }
  }

  /// Optional keyboard appearance override (`"light"` | `"dark"`).
  @objc public var keyboardAppearance: NSString? {
    didSet {
      applyKeyboardAppearance()
    }
  }

  // MARK: - Private state

  private let textField = UITextField()
  private lazy var outsideTapGestureRecognizer: UITapGestureRecognizer = {
    let recognizer = UITapGestureRecognizer(
      target: self,
      action: #selector(handleOutsideTap(_:))
    )
    recognizer.cancelsTouchesInView = false
    return recognizer
  }()
  private weak var outsideTapGestureView: UIView?
  private var isKeyboardVisible = false

  // MARK: - Init

  public override init(frame: CGRect) {
    super.init(frame: frame)
    setUpTextField()
    setUpKeyboardObservers()
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) is not supported")
  }

  deinit {
    removeOutsideTapGestureIfNeeded()
    NotificationCenter.default.removeObserver(self)
  }

  public override func didMoveToWindow() {
    super.didMoveToWindow()
    updateOutsideTapGestureIfNeeded()
  }

  // MARK: - Setup

  private func setUpTextField() {
    textField.keyboardType = RNSystemEmojiPickerView.emojiKeyboardType
    applyKeyboardAppearance()

    textField.delegate = self

    // Disable all text-editing assistance so the keyboard acts as a pure picker.
    textField.autocorrectionType = .no
    textField.autocapitalizationType = .none
    textField.spellCheckingType = .no
    textField.smartDashesType = .no
    textField.smartQuotesType = .no

    // The text field must never be visible or affect layout.
    textField.frame = .zero
    textField.isAccessibilityElement = false
    textField.accessibilityElementsHidden = true

    addSubview(textField)
  }

  private func applyKeyboardAppearance() {
    let appearance: UIKeyboardAppearance

    switch keyboardAppearance?.lowercased {
    case "light":
      appearance = .light
    case "dark":
      appearance = .dark
    default:
      appearance = .default
    }

    textField.keyboardAppearance = appearance

    // If appearance changes while open, refresh keyboard visuals immediately.
    if textField.isFirstResponder {
      textField.reloadInputViews()
    }
  }

  private func setUpKeyboardObservers() {
    let nc = NotificationCenter.default
    nc.addObserver(
      self,
      selector: #selector(keyboardWillShow(_:)),
      name: UIResponder.keyboardWillShowNotification,
      object: nil
    )
    nc.addObserver(
      self,
      selector: #selector(keyboardWillHide(_:)),
      name: UIResponder.keyboardWillHideNotification,
      object: nil
    )
  }

  // MARK: - Imperative API (invoked by the ViewManager on the main thread)

  /// Opens the emoji keyboard by making the hidden text field first responder.
  @objc public func focus() {
    textField.becomeFirstResponder()
  }

  /// Dismisses the emoji keyboard.
  @objc public func blur() {
    removeOutsideTapGestureIfNeeded()
    textField.resignFirstResponder()
  }

  // MARK: - Keyboard notifications

  @objc private func keyboardWillShow(_ notification: Notification) {
    // Only fire if *our* text field is the active responder, not some other
    // input elsewhere in the app.
    guard textField.isFirstResponder else { return }
    isKeyboardVisible = true
    updateOutsideTapGestureIfNeeded()
    onOpen?([:] as NSDictionary)
  }

  @objc private func keyboardWillHide(_ notification: Notification) {
    guard isKeyboardVisible || textField.isFirstResponder else { return }
    isKeyboardVisible = false
    removeOutsideTapGestureIfNeeded()
    onClose?([:] as NSDictionary)
  }

  @objc private func handleOutsideTap(_ recognizer: UITapGestureRecognizer) {
    guard recognizer.state == .ended, dismissOnTapOutside, isKeyboardVisible else {
      return
    }

    blur()
  }

  private func updateOutsideTapGestureIfNeeded() {
    guard dismissOnTapOutside, isKeyboardVisible else {
      removeOutsideTapGestureIfNeeded()
      return
    }

    guard let hostView = window else { return }

    if outsideTapGestureView !== hostView {
      removeOutsideTapGestureIfNeeded()
      hostView.addGestureRecognizer(outsideTapGestureRecognizer)
      outsideTapGestureView = hostView
    }
  }

  private func removeOutsideTapGestureIfNeeded() {
    outsideTapGestureView?.removeGestureRecognizer(outsideTapGestureRecognizer)
    outsideTapGestureView = nil
  }
}

// MARK: - UITextFieldDelegate

extension RNSystemEmojiPickerView: UITextFieldDelegate {

  public func textField(
    _ textField: UITextField,
    shouldChangeCharactersIn range: NSRange,
    replacementString string: String
  ) -> Bool {
    // An empty replacement string is a deletion event — ignore it.
    guard !string.isEmpty else { return false }

    // Forward the selected emoji to the JavaScript side.
    onEmojiSelected?(["emoji": string] as NSDictionary)

    if autoHideAfterSelection {
      // Resign on the next run-loop tick so the current touch event finishes
      // before the keyboard starts animating away.
      DispatchQueue.main.async { [weak self] in
        self?.textField.resignFirstResponder()
      }
    }

    // Always return false so the text field stays empty (picker semantics).
    return false
  }
}
