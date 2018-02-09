#import <Foundation/Foundation.h>
#import "MBGPlatform.h"
#import "MBGSocialPeople.h"
#import "MBGSocialService.h"
#import "MBGSocialJPService.h"
#import "MBGBankDebit.h"
#import "MobageHelper.h"
#import "CocosHelper.h"

#pragma mark - MBGPlatformDelegate

@implementation MobageHelper

- (id)init {
    baseUrl = @"http://mobagebattle.example.com/";
    _loginStat = LOGIN_REQUIRED;
    _splashComplete = NO;
    _loginUserId = nil;

    return self;
}

+ (id)sharedInstance {
    static MobageHelper *mobageHelper = nil;
    
    @synchronized(self) {
        if (!mobageHelper) {
            mobageHelper = [[self alloc] init];
        }
    }
    return mobageHelper;
}

+ (void)initializeMobage:(BOOL)isReleaseFromJs {
    MobageHelper *helper = [self sharedInstance];
    
    if (isReleaseFromJs) {
        helper->baseUrl = @"http://endingroadios.example.com/";
        [MBGPlatform initialize:MBG_REGION_JP
                     serverType:MBG_PRODUCTION
                    consumerKey:@""
                 consumerSecret:@""
                          appId:@""];
    } else {
        [MBGPlatform initialize:MBG_REGION_JP
                     serverType:MBG_SANDBOX
                    consumerKey:@""
                 consumerSecret:@""
                          appId:@""];
    }
    
    // set MBGLoginDelegate to receive callback
    [[MBGPlatform sharedPlatform] setDelegate:helper];
    
    // send request to check login status
    [[MBGPlatform sharedPlatform] checkLoginStatus];
}

- (void)checkProgress
{
    if(_loginStat == LOGIN_REQUIRED && _splashComplete){
        NSLog(@"calling showLoginDialog");
        [[MBGPlatform sharedPlatform] showLoginDialog];
    }
    if(_loginStat == LOGIN_COMPLETE && _splashComplete) {
        NSLog(@"calling gameStart");
        GSCCompletionHandler handler = ^(NSURLResponse *res, NSData *data, NSError *error) {
            [self postResponseFilter:res];
            NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)res;

            if ([httpResponse statusCode] == 200) {
                NSString *result = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
                [self authorizeToken:result];
            } else {
                [self showError];
            }
        };
        NSString *paramsString = [NSString stringWithFormat:@"userId=%@", _loginUserId];
        [self postFunc:@"oauth/request_temporary_credential" parameters:paramsString handler:handler];
    }
}

- (void)authorizeToken:(NSString *) token {
    if ([self isMaintenance:token]) {
        [self goToMaintenance:token];
        return;
    }
    [MBGSocialAuth authorizeToken:token
        onSuccess:^(NSString *verifier) {
            NSLog(@"verifier code = %@", verifier);
            GSCCompletionHandler handler = ^(NSURLResponse *res, NSData *data, NSError *error) {
                [self postResponseFilter:res];
                NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)res;
                
                if ([httpResponse statusCode] == 200) {
                    [CocosHelper JsObjCBridge:@"Configure.loadData(null);"];
                } else {
                    [self showError];
                }
            };
            NSString *paramsString = [NSString stringWithFormat:@"verifier=%@", verifier];
            [self postFunc:@"oauth/request_token_credential" parameters:paramsString handler:handler];
        }
        onError:^(MBGError *error) {
            NSLog(@"code [%ld] reason = %@", (long)error.code, error.description);
        }
    ];
}

- (void)onSplashComplete
{
    MobageHelper *helper = [MobageHelper sharedInstance];
    
    NSLog(@"onSplashComplete");
    [[MBGPlatform sharedPlatform] hideSplashScreen];
    helper->_splashComplete = YES;
    [helper checkProgress];
}

- (void)onLoginComplete:(NSString *)userId
{
    MobageHelper *helper = [MobageHelper sharedInstance];
    
    NSLog(@"onLoginComplete");
    helper->_loginStat = LOGIN_COMPLETE;
    if (!helper->_loginUserId || ![helper->_loginUserId isEqualToString:userId]) {
        helper->_loginUserId = userId;
        [helper checkProgress];
    }
}

- (void)onLoginRequired
{
    MobageHelper *helper = [MobageHelper sharedInstance];
    
    NSLog(@"onLoginRequired");
    helper->_loginStat = LOGIN_REQUIRED;
    [helper checkProgress];
}

- (void)onLoginError:(MBGError *)error
{
    NSLog(@"onLoginError %ld %@", (long)[error code], [error description]);
}

-(void)onLoginCancel
{
    NSLog(@"onLoginCancel");
}

+ (void)payment:(NSString *)itemId {
    MobageHelper *helper = [MobageHelper sharedInstance];
    
    GSCCompletionHandler handler = ^(NSURLResponse *res, NSData *data, NSError *error) {
        [helper postResponseFilter:res];
        NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)res;
        
        if ([httpResponse statusCode] == 200) {
            NSString *result = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
            [helper continueTransaction:result];
        } else {
            NSString *result2 = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
            [helper showError];
        }
    };
    NSString *paramsString = [NSString stringWithFormat:@"item_id=%@", itemId];
    [helper postFunc:@"payments/create_transaction" parameters:paramsString handler:handler];
}

- (void)continueTransaction:(NSString *)transactionId {
    if ([self isMaintenance:transactionId]) {
        [self goToMaintenance:transactionId];
        return;
    }
    if ([transactionId rangeOfString:@"paymentError"].location != NSNotFound) {
        [self showError:transactionId];
    }
    [MBGBankDebit
     continueTransaction:transactionId
     onSuccess:^(MBGTransaction *transaction) {
         GSCCompletionHandler handler = ^(NSURLResponse *res, NSData *data, NSError *error) {
             [self postResponseFilter:res];
             NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)res;
             
             if ([httpResponse statusCode] == 200) {
                 NSString *json = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
                 [CocosHelper JsObjCBridge:[NSString stringWithFormat:@"Payment.callbackFunc('%@');", json]];
             } else {
                 [self showError];
             }
         };
         NSString *paramsString = [NSString stringWithFormat:@"tid=%@", transactionId];
         [self postFunc:@"payments/start_transaction" parameters:paramsString handler:handler];
     }
     onCancel:^{
         NSString *json = @"{\"result\":false,\"error\":\"cancel\"}";
         [CocosHelper JsObjCBridge:[NSString stringWithFormat:@"Payment.callbackFunc('%@');", json]];
     }
     onError:^(MBGError *error) {
         NSString *json = @"{\"result\":false,\"error\":\"error\"}";
         [CocosHelper JsObjCBridge:[NSString stringWithFormat:@"Payment.callbackFunc('%@');", json]];
     }];
}

- (void)postFunc:(NSString *)url parameters:(NSString *)paramsString handler:(GSCCompletionHandler)handler {
    // make post request instance.
    NSURL *urlObj = [NSURL URLWithString:[NSString stringWithFormat:@"%@%@", baseUrl, url]];
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:urlObj];
    [request setHTTPMethod:@"POST"];
    [request setHTTPBody:[paramsString dataUsingEncoding:NSUTF8StringEncoding]];
    [request setValue:@"application/x-www-form-urlencoded" forHTTPHeaderField:@"Content-Type"];
    [request setValue:[NSString stringWithFormat:@"%lu", (unsigned long)[paramsString length]] forHTTPHeaderField:@"Content-Length"];
    
    // CookieStorageから保存されたCookieを読み込み、
    // リクエストにCookieを設定します。
    NSArray *cookies = [[NSHTTPCookieStorage sharedHTTPCookieStorage] cookiesForURL:urlObj];
    if (cookies.count) {
        NSDictionary *header = [NSHTTPCookie requestHeaderFieldsWithCookies:cookies];
        [request setAllHTTPHeaderFields:header];
    }
    
    // send request
    [NSURLConnection sendAsynchronousRequest:request queue:[NSOperationQueue mainQueue] completionHandler:handler];
}

- (void)postResponseFilter:(NSURLResponse *)res {
    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)res;
    NSURL *urlObj = httpResponse.URL;
    if ([[NSHTTPCookieStorage sharedHTTPCookieStorage] cookiesForURL:urlObj].count > 0) {
        return;
    }
    NSArray *cookies = [NSHTTPCookie cookiesWithResponseHeaderFields:httpResponse.allHeaderFields forURL:urlObj];
    for (int i = 0; i < cookies.count; i++) {
        NSHTTPCookie *cookie = [cookies objectAtIndex:i];
        //NSLog(@"cookie: name=%@, value=%@", cookie.name, cookie.value);
        [[NSHTTPCookieStorage sharedHTTPCookieStorage] setCookie:cookie];
    }
}

+ (void)post:(NSString *)url parameters:(NSString *)paramsString {
    MobageHelper *helper = [MobageHelper sharedInstance];
    // response handler
    GSCCompletionHandler handler = ^(NSURLResponse *res, NSData *data, NSError *error) {
        [helper postResponseFilter:res];
        if (data) {
            NSString *result = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
            NSString *script = [NSString stringWithFormat:@"Communicator.postCallback('%@');", result];
            [CocosHelper JsObjCBridge:script];
        } else {
            NSLog(@"error: %@", error);
        }
    };
    [helper postFunc:url parameters:paramsString handler:handler];
}

- (void)showError {
    [self showError:@""];
}

- (void)showError:(NSString *)json {
    NSString *js;
    if ([json compare:@""] == NSOrderedSame) {
        js = @"Configure.error();";
    } else {
        js = [NSString stringWithFormat:@"Configure.error('%@');", json];
    }
    [CocosHelper JsObjCBridge:js];
}

- (BOOL)isMaintenance:(NSString *)json {
    NSRange range = [json rangeOfString: @"\"maintenance\":true"];
    return (range.location != NSNotFound);
}

- (void)goToMaintenance:(NSString *)json {
    [CocosHelper JsObjCBridge:[NSString stringWithFormat:@"Configure.maintenanceFromNative('%@');", json]];
}

+ (void)showBankUi {
    [MBGSocialService
     showBankUI:^{
     }];
}

+ (void)openLegal {
    [MBGSocialJPService openDocument:MBG_LEGAL onDismiss:^{
    }];
}

+ (void)openContact {
    [MBGSocialJPService openDocument:MBG_CONTACT onDismiss:^{
    }];
}

+ (void)showCommunityUI {
    [MBGSocialService showCommunityUI:^{
    }];
}

@end