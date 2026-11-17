package com.anduv.nutukakisi;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Ekran uyanık kalsın: oyun/uygulama açıkken dokunulmasa da kararmasın (maç izlerken)
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
}
