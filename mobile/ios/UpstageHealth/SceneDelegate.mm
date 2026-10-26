#import "SceneDelegate.h"
#import "AppDelegate.h"
#import <React/RCTLinkingManager.h>

@implementation SceneDelegate

- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session options:(UISceneConnectionOptions *)connectionOptions
{
  if (![scene isKindOfClass:[UIWindowScene class]]) {
    return;
  }

  UIWindowScene *windowScene = (UIWindowScene *)scene;
  AppDelegate *appDelegate = (AppDelegate *)[UIApplication sharedApplication].delegate;

  if (appDelegate.window) {
    self.window = appDelegate.window;
    self.window.windowScene = windowScene;
  } else {
    self.window = [[UIWindow alloc] initWithWindowScene:windowScene];
    self.window.rootViewController = appDelegate.window.rootViewController;
    appDelegate.window = self.window;
  }

  [self.window makeKeyAndVisible];
}

- (void)scene:(UIScene *)scene openURLContexts:(NSSet<UIOpenURLContext *> *)URLContexts
{
  UIOpenURLContext *urlContext = URLContexts.allObjects.firstObject;
  if (urlContext) {
    [RCTLinkingManager application:[UIApplication sharedApplication] openURL:urlContext.URL options:@{}];
  }
}

- (void)scene:(UIScene *)scene continueUserActivity:(NSUserActivity *)userActivity
{
  [RCTLinkingManager application:[UIApplication sharedApplication] continueUserActivity:userActivity restorationHandler:^(NSArray<id<UIUserActivityRestoring>> * _Nullable restorableObjects) {}];
}

@end
