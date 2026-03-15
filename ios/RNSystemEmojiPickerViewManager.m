#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>

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

// ---------------------------------------------------------------------------
// Commands
//
// Exported via constantsToExport so that JS can look them up with:
//   UIManager.getViewManagerConfig('RNSystemEmojiPickerView').Commands.focus
// ---------------------------------------------------------------------------

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return @{
    @"Commands": @{
      @"focus": @0,
      @"blur":  @1,
    },
  };
}

/// Handles commands dispatched from JS via UIManager.dispatchViewManagerCommand.
- (void)receiveCommand:(UIView *)view
             commandID:(NSInteger)commandID
                  args:(NSArray *)args
{
  RNSystemEmojiPickerView *pickerView = (RNSystemEmojiPickerView *)view;
  switch (commandID) {
    case 0:
      [pickerView focus];
      break;
    case 1:
      [pickerView blur];
      break;
    default:
      break;
  }
}

@end
