import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        application.isIdleTimerDisabled = true // ekran uyanık kalsın (maç izlerken kararmasın)
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        application.isIdleTimerDisabled = true
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

// MARK: Mr. Anduv! eşitleme (G84) başı
// Kayıtlar iCloud anahtar-değer deposunda, kullanıcının kendi Apple hesabında. JS tarafı: esitle.js.
// Sunucu yok; geliştirici hiçbir veriyi görmez.
import Capacitor
@objc(EsitlePlugin)
public class EsitlePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "EsitlePlugin"
    public let jsName = "Esitle"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "oku", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "yaz", returnType: CAPPluginReturnPromise)
    ]
    private let kv = NSUbiquitousKeyValueStore.default

    override public func load() {
        NotificationCenter.default.addObserver(self, selector: #selector(disaridanDegisti(_:)),
            name: NSUbiquitousKeyValueStore.didChangeExternallyNotification, object: kv)
        kv.synchronize()
    }

    @objc func disaridanDegisti(_ n: Notification) {
        let anahtarlar = (n.userInfo?[NSUbiquitousKeyValueStoreChangedKeysKey] as? [String]) ?? []
        notifyListeners("degisti", data: ["anahtarlar": anahtarlar])
    }

    // Boş liste: depodaki bütün anahtarlar
    @objc func oku(_ call: CAPPluginCall) {
        kv.synchronize()
        var d: [String: Any] = [:]
        let liste = call.getArray("anahtarlar", String.self) ?? []
        if liste.isEmpty {
            for (k, v) in kv.dictionaryRepresentation { if let s = v as? String { d[k] = s } }
        } else {
            for k in liste { if let v = kv.string(forKey: k) { d[k] = v } }
        }
        call.resolve(["degerler": d, "icloud": FileManager.default.ubiquityIdentityToken != nil])
    }

    @objc func yaz(_ call: CAPPluginCall) {
        for (k, v) in call.getObject("degerler") ?? [:] { if let s = v as? String { kv.set(s, forKey: k) } }
        kv.synchronize()
        call.resolve()
    }
}

class AnaViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(EsitlePlugin())
    }
}
// MARK: Mr. Anduv! eşitleme (G84) sonu
