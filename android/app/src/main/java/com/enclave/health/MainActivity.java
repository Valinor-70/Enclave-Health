package com.enclave.health;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.browser.customtabs.CustomTabColorSchemeParams;
import android.net.Uri;
import android.content.Intent;
import android.graphics.Color;

public class MainActivity extends AppCompatActivity {

    private static final String TWA_URL = "https://enclavefit.app";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Create custom tab with Enclave theme colors
        CustomTabColorSchemeParams.Builder darkColorBuilder = new CustomTabColorSchemeParams.Builder();
        darkColorBuilder.setToolbarColor(Color.parseColor("#0b0f14"));
        darkColorBuilder.setSecondaryToolbarColor(Color.parseColor("#0f1720"));
        darkColorBuilder.setNavigationBarColor(Color.parseColor("#0b0f14"));
        
        CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
        builder.setDefaultColorSchemeParams(darkColorBuilder.build());
        builder.setShowTitle(true);
        builder.setStartAnimations(this, android.R.anim.fade_in, android.R.anim.fade_out);
        builder.setExitAnimations(this, android.R.anim.fade_in, android.R.anim.fade_out);
        
        CustomTabsIntent customTabsIntent = builder.build();
        
        // Launch the PWA
        customTabsIntent.launchUrl(this, Uri.parse(TWA_URL));
        
        // Close this activity so the back button works correctly
        finish();
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        
        // Handle deep links and app launches
        if (Intent.ACTION_VIEW.equals(intent.getAction())) {
            Uri data = intent.getData();
            if (data != null) {
                // Launch PWA with the specific URL
                CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
                CustomTabsIntent customTabsIntent = builder.build();
                customTabsIntent.launchUrl(this, data);
            }
        }
        
        finish();
    }
}