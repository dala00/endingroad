#ifndef InfinityBattle_CocosHelper_h
#define InfinityBattle_CocosHelper_h

@interface CocosHelper : NSObject {
    
}

+ (void)JsObjCBridge:(NSString *)str;
+ (NSString *)convertToUnicode:(NSString *)original;
+ (BOOL)isJapan;

@end

#endif
