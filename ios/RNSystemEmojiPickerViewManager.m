#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>
#import <React/RCTLog.h>

// The Swift class is accessible via the pod's auto-generated Swift header.
// CocoaPods names it "<module_name>-Swift.h" where the module name is the
// pod name with hyphens replaced by underscores.
#if __has_include(<react_native_system_emoji_picker/react_native_system_emoji_picker-Swift.h>)
#import <react_native_system_emoji_picker/react_native_system_emoji_picker-Swift.h>
#else
#import "react_native_system_emoji_picker-Swift.h"
#endif

@interface RNSystemEmojiPickerViewManager : RCTViewManager
@end

@implementation RNSystemEmojiPickerViewManager

// Register this class both as a native view ("RNSystemEmojiPickerView") and
// as a bridge module so that JS can call dispatchViewManagerCommand on it.
RCT_EXPORT_MODULE(RNSystemEmojiPickerView)

- (UIView *)view
{
  return [[RNSystemEmojiPickerView alloc] init];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

RCT_EXPORT_VIEW_PROPERTY(onEmojiSelected, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onOpen, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onClose, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(autoHideAfterSelection, BOOL)
RCT_EXPORT_VIEW_PROPERTY(dismissOnTapOutside, BOOL)

RCT_EXPORT_METHOD(focus:(nonnull NSNumber *)reactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager,
                                      NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if (![view isKindOfClass:[RNSystemEmojiPickerView class]]) {
      RCTLogError(@"Invalid view returned from registry, expecting RNSystemEmojiPickerView, got: %@", view);
      return;
    }
    [(RNSystemEmojiPickerView *)view focus];
  }];
}

RCT_EXPORT_METHOD(blur:(nonnull NSNumber *)reactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager,
                                      NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if (![view isKindOfClass:[RNSystemEmojiPickerView class]]) {
      RCTLogError(@"Invalid view returned from registry, expecting RNSystemEmojiPickerView, got: %@", view);
      return;
    }
    [(RNSystemEmojiPickerView *)view blur];
  }];
}

@end
