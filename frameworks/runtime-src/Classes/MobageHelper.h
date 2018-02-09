#ifndef ChromeBattle_MobageHelper_h
#define ChromeBattle_MobageHelper_h

#import "MBGPlatform.h"
#import "MBGSocialPeople.h"

typedef void (^GSCCompletionHandler)(NSURLResponse *res, NSData *data, NSError *error);

@interface MobageHelper : NSObject <MBGPlatformDelegate>
{
    enum LOGIN_STAT {
        LOGIN_REQUIRED,
        LOGIN_COMPLETE,
    };
    LOGIN_STAT _loginStat;
    BOOL _splashComplete;
    NSString *_loginUserId;
    NSString *baseUrl;
}

+ (void)initializeMobage:(BOOL)isReleaseFromJs;
- (void)authorizeToken:(NSString *) token;
+ (void)payment:(NSString *)itemId;
- (void)postFunc:(NSString *)url parameters:(NSString *)paramsString handler:(GSCCompletionHandler)handler;
- (void)postResponseFilter:(NSURLResponse *)res;
+ (void)post:(NSString *)url parameters:(NSString *)paramsString;
+ (void)showBankUi;
+ (void)openLegal;
+ (void)openContact;
+ (void)showCommunityUI;

@end

#endif
