package com.anduv.nutukakisi;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Ekran uyanık kalsın: oyun/uygulama açıkken dokunulmasa da kararmasın (maç izlerken)
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
    // SES KORUYUCU (Mr. Anduv! standardı, 22 Kas 2026): uygulamaya dönünce web sesini uyandır
    @Override
    public void onResume() {
        super.onResume();
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                final android.webkit.WebView w = getBridge().getWebView();
                w.onResume();
                w.resumeTimers();
                w.postDelayed(() -> w.evaluateJavascript("window.sesKurtar&&window.sesKurtar()", null), 250);
                w.postDelayed(() -> w.evaluateJavascript("window.sesKurtar&&window.sesKurtar()", null), 1000);
            }
        } catch (Exception e) { }
    }
}
