/****************************************************************************
Copyright (c) 2008-2010 Ricardo Quesada
Copyright (c) 2010-2012 cocos2d-x.org
Copyright (c) 2011      Zynga Inc.
Copyright (c) 2013-2014 Chukong Technologies Inc.
 
http://www.cocos2d-x.org

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
****************************************************************************/
package org.cocos2dx.javascript;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.ArrayList;

import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.NameValuePair;
import org.apache.http.ParseException;
import org.apache.http.client.ResponseHandler;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.util.EntityUtils;
import org.cocos2dx.lib.Cocos2dxActivity;
import org.cocos2dx.lib.Cocos2dxGLSurfaceView;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;

import com.mobage.android.Mobage;
import com.mobage.android.Error;
import com.mobage.android.Mobage.MarketCode;
import com.mobage.android.Mobage.PlatformListener;
import com.mobage.android.social.User;
import com.mobage.android.social.common.People;
import com.mobage.android.social.common.People.OnGetUserComplete;
import com.mobage.android.social.common.Service;

import android.content.pm.ActivityInfo;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;
import android.widget.Toast;
import android.app.AlertDialog;
import android.content.DialogInterface;
import jp.mbga.a12022179.R;

// The name of .so is specified in AndroidMenifest.xml. NativityActivity will load it automatically for you.
// You can use "System.loadLibrary()" to load other .so files.

public class AppActivity extends Cocos2dxActivity{

    static String hostIPAdress = "0.0.0.0";
    private static AppActivity activity;
    protected static final String TAG = "AppActivity";
    private Mobage.PlatformListener mPlatformListener = null;
    private static enum LOGIN_STAT { IDLE, REQUIRED, COMPLETE, CANCELED };
    public OpenSocial openSocial;
    public boolean isRelease;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // TODO Auto-generated method stub
        super.onCreate(savedInstanceState);
        
        if(nativeIsLandScape()) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT);
        }
        if(nativeIsDebug()){
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON, WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }
        hostIPAdress = getHostIpAddress();
        activity = this;
    }
    
    @Override
    public Cocos2dxGLSurfaceView onCreateView() {
        Cocos2dxGLSurfaceView glSurfaceView = new Cocos2dxGLSurfaceView(this);
        // TestCpp should create stencil buffer
        glSurfaceView.setEGLConfigChooser(5, 6, 5, 0, 16, 8);

        return glSurfaceView;
    }
    
    @Override
    protected void onResume() {
    	super.onResume();
        Mobage.onResume(this);
    	activity = this;
    }

    public String getHostIpAddress() {
        WifiManager wifiMgr = (WifiManager) getSystemService(WIFI_SERVICE);
        WifiInfo wifiInfo = wifiMgr.getConnectionInfo();
        int ip = wifiInfo.getIpAddress();
        return ((ip & 0xFF) + "." + ((ip >>>= 8) & 0xFF) + "." + ((ip >>>= 8) & 0xFF) + "." + ((ip >>>= 8) & 0xFF));
    }
    
    public static void test() {
    	if (activity == null) return;
    	
    	activity.runOnUiThread(new Runnable() {
    		@Override
    		public void run() {
		        AlertDialog.Builder alertDialog=new AlertDialog.Builder(activity);
		        alertDialog.setTitle("タイトルです");
		        alertDialog.setMessage("メッセージ内容です");
		        alertDialog.setPositiveButton("OK",new DialogInterface.OnClickListener() {
		            public void onClick(DialogInterface dialog,int whichButton) {
		            }
		        });
		        AlertDialog ad = alertDialog.create();
		        ad.show();
    		}
    	});
    }
    
    public static String getLocalIpAddress() {
        return hostIPAdress;
    }
    
    private static native boolean nativeIsLandScape();
    private static native boolean nativeIsDebug();
    
    @Override
    public void onStart(){
        super.onStart();
        Mobage.onStart(this);
    }
 
    @Override
    public void onPause(){
        super.onPause();
        Mobage.onPause(this);
    }
 
    @Override
    public void onStop(){
        super.onStop();
        Mobage.onStop(this);
    }
 
    @Override
    public void onRestart(){
        super.onRestart();
        Mobage.onRestart(this);
        setPlatformListener();
    }
 
    @Override
    public void onDestroy(){
        super.onDestroy();
        Mobage.onDestroy(this);
    }
 
    public static void initializeMobage(final boolean isReleaseFromJs) {
    	activity.isRelease = isReleaseFromJs;
    	activity.runOnUiThread(new Runnable() {
    		@Override
    		public void run() {
		        // Deprecated. version 1.4.2 or later.  Mobage.registerResources is no longer necessary. Mobage.initialize() must be called once and only once.
		        Mobage.registerResources(R.layout.mobage_splash,
		                                 R.drawable.mobage_close, 
		                                 R.drawable.mobage_coin_blue,
		                                 R.drawable.mobage_coin_white);
		        if (isReleaseFromJs) {
			        Mobage.initialize(Mobage.Region.JP, Mobage.ServerMode.PRODUCTION,
	                          "",
	                          "",
	                          "", activity, true);
		        } else {
			        Mobage.initialize(Mobage.Region.JP, Mobage.ServerMode.SANDBOX,
			                          "",
			                          "",
			                          "", activity, true);
		        }
		        Mobage.registerTick();
		 
		        Mobage.onCreate(activity);
		        activity.setPlatformListener();
		        // checkLoginStatus should be invoked only when launching app
		        Mobage.checkLoginStatus();
    		}
    	});
    }
    
    public static void post(final String url, final String paramsString) {
    	final AppActivity self = activity;
		ArrayList <NameValuePair> params = new ArrayList <NameValuePair>();
		if (paramsString.length() > 0) {
	    	String[] parts = paramsString.split("&");
	    	for (int i = 0; i < parts.length; i++) {
	    		String[] row = parts[i].split("=");
	    		try {
					params.add(new BasicNameValuePair(URLDecoder.decode(row[0], "utf-8"), URLDecoder.decode(row[1], "utf-8")));
				} catch (UnsupportedEncodingException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
	    	}
		}
    	activity.openSocial.post(url, params, new ResponseHandler<Void>() {
		    @Override
		    public Void handleResponse(HttpResponse response) {
	            switch (response.getStatusLine().getStatusCode()) {
	            case HttpStatus.SC_OK:
	                try {
						final String json = EntityUtils.toString(response.getEntity(), "UTF-8");
	                	self.runOnGLThread(new Runnable() {
	                		@Override
	                		public void run() {
	                			Cocos2dxJavascriptJavaBridge.evalString("Communicator.postCallback('" + json + "')");
	                		}
	                	});
					} catch (ParseException e) {
						e.printStackTrace();
					} catch (IOException e) {
						e.printStackTrace();
					}
	                return null;
	            case HttpStatus.SC_NOT_FOUND:
	                throw new RuntimeException("nodata"); //FIXME
	            
	            default:
	                throw new RuntimeException("nodata"); //FIXME
	            }
		    }
		});
    }
    
    public static void payment(final String itemId) {
		activity.openSocial.paymentStart(itemId);
    }
    
    public static void showBankUi() {
    	Service.showBankUi(new Service.OnDialogComplete() {
    	    @Override
    	    public void onDismiss() {
    	        // モバコイン購入後の処理を実装する。
    	        // getBalance API を使用して、モバコインの残高を更新する。
    	    }
    	});
    }
    
    public static void openLegal() {
    	com.mobage.android.social.jp.Service.openDocument(com.mobage.android.social.jp.Service.DocumentType.LEGAL, new com.mobage.android.social.jp.Service.OnDialogComplete() {
    	    @Override
    	    public void onDismiss() {
    	    }
    	});
    }
    
    public static void openContact() {
    	com.mobage.android.social.jp.Service.openDocument(com.mobage.android.social.jp.Service.DocumentType.CONTACT, new com.mobage.android.social.jp.Service.OnDialogComplete() {
    	    @Override
    	    public void onDismiss() {
    	    }
    	});
    }
    
    public static void showCommunityUI() {
    	Service.showCommunityUI(new Service.OnDialogComplete() {
    	    @Override
    	    public void onDismiss() {
    	        // モバコイン購入後の処理を実装する。
    	        // getBalance API を使用して、モバコインの残高を更新する。
    	    }
    	});
    }
 
    public void setPlatformListener() {
        final AppActivity self = this;
        if (mPlatformListener == null) {
            mPlatformListener = new PlatformListener() {
                boolean mSplashCompleted = false;
                private LOGIN_STAT mLoginStat = LOGIN_STAT.IDLE;
                private String mUserId;
 
                @Override
                public void onLoginRequired() {
                    Log.i(TAG, "Login required.");
                    mLoginStat = LOGIN_STAT.REQUIRED;
                    checkProgress();
                }
 
                @Override
                public void onLoginComplete(String userId) {
                    Log.i(TAG, "Login completed:" + userId);
                    mUserId = userId;
                    mLoginStat = LOGIN_STAT.COMPLETE;
                    checkProgress();
                }
 
                @Override
                public void onSplashComplete() {
                    Log.i(TAG, "Splash Completed.");
                    mSplashCompleted = true;
                    checkProgress();
                }
                @Override
                public void onLoginError(Error error) {
                    self.showMessageToast("Login failed. " +error.getDescription());
                }
                @Override
                public void onLoginCancel() {
                    self.showMessageToast("Login Canceled. ");
                }
 
                private void checkProgress() {
                    if (mLoginStat == LOGIN_STAT.REQUIRED  && mSplashCompleted) {
                        Mobage.showLoginDialog();
                    }
                    if (mLoginStat == LOGIN_STAT.COMPLETE && mSplashCompleted) {
                        Mobage.hideSplashScreen();
                    	self.openSocial = new OpenSocial();
                    	self.openSocial.initialize(mUserId, self, self.isRelease);
                    }
                }
            };
        }
        Mobage.addPlatformListener(this, mPlatformListener);
    }
    
    public void showMessageToast(String message) {
    	Toast.makeText(this, message, Toast.LENGTH_LONG).show();
    }
    
    public void helloMobage() {
    	final AppActivity self = this;
        Log.v(TAG, "begin helloMobage");
        User.Field[] fields = {User.Field.ID,
                              User.Field.NICKNAME,
                              User.Field.HAS_APP};
        People.getCurrentUser(fields, new OnGetUserComplete(){
            @Override
            public void onSuccess(User user) {
            	self.openSocial = new OpenSocial();
            	self.openSocial.initialize(user.getId(), self, self.isRelease);
                Log.v(TAG, "helloMobage() Success:" + user.getNickname());
            }
            @Override
            public void onError(com.mobage.android.Error error) {
                Log.v(TAG, "helloMobage() Error:" + error.getDescription());
            }
        });
    }
    
    public String getMarketCode() {
    	Mobage.MarketCode marketCode = Mobage.getMarketCode();
    	switch(marketCode){
    	case GOOGLE_ANDROID_MARKET:
    		return "GOOGLE_ANDROID_MARKET";
    	case MOBAGE:
    		return "MOBAGE";
    	default:
    	    return "";
    	}
	}
}
