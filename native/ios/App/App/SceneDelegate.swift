import UIKit
import Capacitor
import AuthenticationServices

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = GeneticAgeWindowController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

private final class GeneticAgeWindowController: UIViewController {
    private let app = GeneticAgeBridgeController()

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 9.0 / 255, green: 9.0 / 255, blue: 11.0 / 255, alpha: 1)
        addChild(app)
        let content = app.view!
        content.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(content)
        let safeArea = view.safeAreaLayoutGuide
        let bottom = content.bottomAnchor.constraint(equalTo: safeArea.bottomAnchor)
        bottom.priority = .defaultHigh
        NSLayoutConstraint.activate([
            content.topAnchor.constraint(equalTo: safeArea.topAnchor),
            content.leadingAnchor.constraint(equalTo: safeArea.leadingAnchor),
            content.trailingAnchor.constraint(equalTo: safeArea.trailingAnchor),
            bottom,
            content.bottomAnchor.constraint(lessThanOrEqualTo: view.keyboardLayoutGuide.topAnchor)
        ])
        app.didMove(toParent: self)
    }
}

private final class GeneticAgeBridgeController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(GeneticAgeProviderSession())
    }
}

@objc(GeneticAgeProviderSession)
private final class GeneticAgeProviderSession: CAPPlugin, CAPBridgedPlugin, ASWebAuthenticationPresentationContextProviding {
    let identifier = "GeneticAgeProviderSession"
    let jsName = "GeneticAgeProviderSession"
    let pluginMethods = [CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise)]
    private let callbackScheme = "xyz.kolequant.geneticage"
    private var session: ASWebAuthenticationSession?
    private weak var anchor: UIWindow?

    @objc func open(_ call: CAPPluginCall) {
        guard let address = call.getString("url"),
              let components = URLComponents(string: address),
              components.scheme == "https", components.host == "geneticage.kolequant.xyz",
              components.path == "/sign-in-start/", components.user == nil,
              components.password == nil, components.port == nil, let url = components.url else {
            call.reject("Invalid provider sign-in address.")
            return
        }
        DispatchQueue.main.async { [weak self] in
            guard let self, self.session == nil,
                  let window = self.bridge?.viewController?.view.window else {
                call.reject("Could not open provider sign-in.")
                return
            }
            self.anchor = window
            let completion: ASWebAuthenticationSession.CompletionHandler = { [weak self] callback, error in
                DispatchQueue.main.async {
                    self?.session = nil
                    self?.anchor = nil
                    if let callback {
                        call.resolve(["url": callback.absoluteString])
                    } else if (error as? ASWebAuthenticationSessionError)?.code == .canceledLogin {
                        call.resolve(["cancelled": true])
                    } else {
                        call.reject("Could not complete provider sign-in.")
                    }
                }
            }
            let session: ASWebAuthenticationSession
            if #available(iOS 17.4, *) {
                session = ASWebAuthenticationSession(url: url, callback: .customScheme(self.callbackScheme), completionHandler: completion)
            } else {
                session = ASWebAuthenticationSession(url: url, callbackURLScheme: self.callbackScheme, completionHandler: completion)
            }
            session.presentationContextProvider = self
            self.session = session
            if !session.start() {
                self.session = nil
                self.anchor = nil
                call.reject("Could not open provider sign-in.")
            }
        }
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        anchor ?? ASPresentationAnchor()
    }
}
