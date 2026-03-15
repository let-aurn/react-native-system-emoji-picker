import UIKit

/// A zero-frame, non-interactive `UIView` that contains a hidden `UITextField`
/// configured to present the system emoji keyboard.
///
/// The keyboard is opened / closed via the `focus()` / `blur()` entry points
/// that the Objective-C `ViewManager` calls on the main thread.
@objc(RNSystemEmojiPickerView)
public final class RNSystemEmojiPickerView: UIView {

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

  // MARK: - Private state

  private let textField = UITextField()

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
    NotificationCenter.default.removeObserver(self)
  }

  // MARK: - Setup

  private func setUpTextField() {
    // Raw value 124 selects the emoji keyboard input type.
    // This is a publicly accessible UIKeyboardType enum case that is not
    // listed in Apple's SDK header but is well-known and widely used in
    // production apps.  No private API selector is involved.
    textField.keyboardType = UIKeyboardType(rawValue: 124) ?? .default

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
    textField.resignFirstResponder()
  }

  // MARK: - Keyboard notifications

  @objc private func keyboardWillShow(_ notification: Notification) {
    // Only fire if *our* text field is the active responder, not some other
    // input elsewhere in the app.
    guard textField.isFirstResponder else { return }
    onOpen?([:] as NSDictionary)
  }

  @objc private func keyboardWillHide(_ notification: Notification) {
    guard textField.isFirstResponder else { return }
    onClose?([:] as NSDictionary)
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
