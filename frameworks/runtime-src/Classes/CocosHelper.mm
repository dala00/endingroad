#import <Foundation/Foundation.h>
#import "CocosHelper.h"
#import "ScriptingCore.h"

@implementation CocosHelper

+ (void)JsObjCBridge:(NSString *)str {
    const char *charstr = [str UTF8String];
    ScriptingCore::getInstance()->evalString(charstr, NULL);
}

+ (NSString *)convertToUnicode:(NSString *)original {
    NSMutableString *str = [NSMutableString string];
    
    for (NSUInteger i = 0; i < original.length; i++) {
        unichar code = [original characterAtIndex:i];
        if (code < 128) {
            NSString *one = [original substringWithRange:NSMakeRange(i, 1)];
            [str appendString:one];
        } else {
            [str appendFormat:@"\\u%04x", code];
        }
    }
    
    return str;
}

+ (BOOL)isJapan {
    NSArray *languages = [NSLocale preferredLanguages];
    NSString *lang = [languages objectAtIndex:0];
    return [lang isEqualToString:@"ja"];
}


@end