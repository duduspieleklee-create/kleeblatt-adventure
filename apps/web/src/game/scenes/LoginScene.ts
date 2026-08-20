import Phaser from "phaser";
import { TEXT_STYLES, UI_CONFIG } from "../ui/UIConstants";
import { log } from "../utils/logger";
import { gameBridge } from "@kleeblatt/shared";
import { signInWithWalletAndExchange, WalletAuthError } from "../utils/walletAuth";

interface MeResponse {
  userId: string;
  email: string;
  displayName: string | null;
  picture: string | null;
  hero: { heroName: string; class: string; level: number } | null;
}

/**
 * LoginScene — auth gate. Checks /api/me on create().
 * If authenticated + has hero → MainMenuScene.
 * If authenticated + no hero → CharacterCreationScene.
 * If not authenticated → shows a backdrop; the React AuthOverlay (Login/Register
 * form) is rendered on top by the web shell. When that completes, the bridge
 * event `auth:authenticated` fires and we re-check /api/me and proceed.
 */
export class LoginScene extends Phaser.Scene {
  private statusText?: Phaser.GameObjects.Text;
  private errorText?: Phaser.GameObjects.Text;
  private loginUIShown = false;

  private readonly onAuthenticated = (): void => {
    void this.checkAuth();
  };

  constructor() {
    super({ key: "LoginScene" });
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    const cx = Math.round(width / 2);
    const cy = Math.round(height / 2);

    this.cameras.main.setBackgroundColor("#1a1a2e");

    this.statusText = this.add
      .text(cx, cy - 20, "Checking login…", {
        ...TEXT_STYLES.body,
        fontSize: "16px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    this.errorText = this.add
      .text(cx, cy + 120, "", {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: "14px",
        color: "#ff6b6b",
        align: "center",
        wordWrap: { width: width - 80 },
      })
      .setOrigin(0.5)
      .setVisible(false);

    // Surface ?auth=error redirects (e.g. Google login failures).
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get("auth");
    if (authParam === "error") {
      const reason = params.get("reason") ?? "unknown";
      this.showError(`Login failed: ${reason}. Please try again.`);
      window.history.replaceState({}, "", window.location.pathname);
    }

    // React drives the actual login UI; when it finishes a non-Google auth,
    // this fires and we proceed into the game.
    gameBridge.on("auth:authenticated", this.onAuthenticated);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameBridge.off("auth:authenticated", this.onAuthenticated);
    });

    void this.checkAuth();
  }

  private async checkAuth(): Promise<void> {
    try {
      const res = await fetch("/api/me", { credentials: "include" });

      if (res.status === 401) {
        this.showLoginUI();
        return;
      }

      if (!res.ok) {
        this.showError("Server error. Please try again later.");
        return;
      }

      const me = (await res.json()) as MeResponse;
      log.info("[LoginScene] Authenticated as", me.email);

      if (me.hero) {
        this.scene.start("MainMenuScene");
      } else {
        this.scene.start("CharacterCreationScene");
      }
    } catch (e) {
      log.error("[LoginScene] Failed to check auth:", e);
      this.showError("Cannot reach server. Please check your connection.");
    }
  }

  private showLoginUI(): void {
    if (this.loginUIShown) return;
    this.loginUIShown = true;

    const { width, height } = this.scale.gameSize;
    const cx = Math.round(width / 2);
    const cy = Math.round(height / 2);

    this.statusText?.setText("Welcome, adventurer!");
    this.statusText?.setColor("#f5e6c8");

    // The React AuthOverlay renders the email/password form on top of this scene.
    this.add
      .text(cx, cy + 20, "Sign in to continue…", {
        ...TEXT_STYLES.body,
        fontSize: "16px",
        color: "#cfcfe6",
      })
      .setOrigin(0.5);

    const walletBtn = this.add
      .text(cx, cy + 80, "Connect Wallet", {
        ...TEXT_STYLES.body,
        fontSize: "18px",
        color: "#a78bfa",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    walletBtn.on("pointerdown", () => {
      void this.handleWalletLogin();
    });
  }

  private showError(msg: string): void {
    this.statusText?.setVisible(false);
    this.errorText?.setText(msg);
    this.errorText?.setVisible(true);
  }

  private async handleWalletLogin(): Promise<void> {
    this.statusText?.setText("Connecting wallet...");
    this.errorText?.setVisible(false);
    try {
      const me = await signInWithWalletAndExchange();
      log.info("[LoginScene] Wallet auth success:", me.userId);
      gameBridge.emit("auth:authenticated");
    } catch (err) {
      if (err instanceof WalletAuthError) {
        this.showError(err.message);
      } else {
        this.showError("Wallet authentication failed. Please try again.");
      }
    }
  }
}
