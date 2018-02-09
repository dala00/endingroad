package org.cocos2dx.javascript;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;

import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.NameValuePair;
import org.apache.http.ParseException;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.CookieStore;
import org.apache.http.client.HttpClient;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.util.EntityUtils;

import android.util.Log;

import com.mobage.android.bank.Debit;
import com.mobage.android.bank.Debit.Transaction;
import com.mobage.android.social.common.Auth;
import com.mobage.android.Error;

import org.cocos2dx.lib.*;

public class OpenSocial {
	private String baseUrl = "http://mobagebattle.example.com/";
	private String userId;
	public CookieStore cookieStore = null;
	public String oauthToken;
	public DefaultHttpClient httpClient;
	public AppActivity activity;
	
	public void initialize(String uid, AppActivity appActivity, boolean isRelease) {
		userId = uid;
		activity = appActivity;
		final OpenSocial self = this;
		if (isRelease) {
			baseUrl = "http://endingroadsp.example.com/";
		}
		
		ArrayList <NameValuePair> params = new ArrayList <NameValuePair>();
		params.add(new BasicNameValuePair("userId", uid));
		 
		post("oauth/request_temporary_credential", params, new ResponseHandler<Void>() {
		    @Override
		    public Void handleResponse(HttpResponse response) {
		    	self.cookieStore = httpClient.getCookieStore();
		    	
		    	// response.getStatusLine().getStatusCode()でレスポンスコードを判定する。
	            // 正常に通信できた場合、HttpStatus.SC_OK（HTTP 200）となる。
	            switch (response.getStatusLine().getStatusCode()) {
	            case HttpStatus.SC_OK:
	                // レスポンスデータを文字列として取得する。
	                // byte[]として読み出したいときはEntityUtils.toByteArray()を使う。
	                try {
						self.authorizeToken(EntityUtils.toString(response.getEntity(), "UTF-8"));
					} catch (ParseException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (IOException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
	                return null;
	            case HttpStatus.SC_NOT_FOUND:
	            	showError();
	            	return null;
	            default:
	            	showError();
	            	return null;
	            }
		    }
		});
	}
	
	public void authorizeToken(String token) {
		oauthToken = token;
		if (isMaintenance(token)) {
			goToMaintenance(token);
			return;
		}
		final AppActivity appActivity = activity;
		Auth.authorizeToken(token, new Auth.OnAuthorizeTokenComplete() {
		     @Override
		     public void onSuccess(String verifierCode) {
 
				Log.i("AppActivity", "verifier code = " + verifierCode);
				
				ArrayList <NameValuePair> params = new ArrayList <NameValuePair>();
				params.add(new BasicNameValuePair("verifier", verifierCode));
				 
				post("oauth/request_token_credential", params, new ResponseHandler<Void>() {
				    @Override
				    public Void handleResponse(HttpResponse response) {
			            switch (response.getStatusLine().getStatusCode()) {
			            case HttpStatus.SC_OK:
			                try {
			                	appActivity.runOnGLThread(new Runnable() {
			                		@Override
			                		public void run() {
			                			String var = "null";
			                			if (appActivity.getMarketCode() == "GOOGLE_ANDROID_MARKET") {
			                				var = "\"GOOGLE_ANDROID_MARKET\"";
			                			}
			                			Cocos2dxJavascriptJavaBridge.evalString("Configure.loadData(" + var + ")");
			                		}
			                	});
		                	} catch (ParseException e) {
		                		showError();
							} catch (Exception e) {
		                		showError();
							}
			                return null;
			            case HttpStatus.SC_NOT_FOUND:
			            	showError();
			            	return null;
			            default:
			            	showError();
			            	return null;
			            }
				    }
				});
		     }
		     @Override
		     public void onError(Error arg0) {
		     }
		});
	}
	
	public void paymentStart(String itemId) {
		final OpenSocial self = this;
		ArrayList <NameValuePair> params = new ArrayList <NameValuePair>();
   		params.add(new BasicNameValuePair("item_id", itemId));
    	post("payments/create_transaction", params, new ResponseHandler<Void>() {
		    @Override
		    public Void handleResponse(HttpResponse response) {
	            switch (response.getStatusLine().getStatusCode()) {
	            case HttpStatus.SC_OK:
	                try {
						self.continueTransaction(EntityUtils.toString(response.getEntity(), "UTF-8"));
					} catch (ParseException e) {
						showError();
					} catch (IOException e) {
						showError();
					}
	                return null;
	            case HttpStatus.SC_NOT_FOUND:
	            	showError();
	            	return null;
	            default:
	            	showError();
	            	return null;
	            }
		    }
		});
	}
	
	public void continueTransaction(final String transactionId) {
		final AppActivity appActivity = activity;
		if (isMaintenance(transactionId)) {
			goToMaintenance(transactionId);
			return;
		}
		if (transactionId.equals("TIMEOUT")) {
			timeout();
			return;
		}
		if (transactionId.indexOf("paymentError") >= 0) {
			showError(transactionId);
			return;
		}
		Debit.continueTransaction(transactionId, new Debit.OnProcessTransactionWithDialogComplete() {
		    @Override
		    public void onSuccess(Transaction arg0) {
		        // ユーザーが購入を確認した場合
		        // 購入処理の開始
				ArrayList <NameValuePair> params = new ArrayList <NameValuePair>();
		   		params.add(new BasicNameValuePair("tid", transactionId));
		    	post("payments/start_transaction", params, new ResponseHandler<Void>() {
				    @Override
				    public Void handleResponse(HttpResponse response) {
			            switch (response.getStatusLine().getStatusCode()) {
			            case HttpStatus.SC_OK:
			                try {
			                	final String json = EntityUtils.toString(response.getEntity(), "UTF-8");
			                	appActivity.runOnGLThread(new Runnable() {
			                		@Override
			                		public void run() {
			                			Cocos2dxJavascriptJavaBridge.evalString("Payment.callbackFunc('" + json + "')");
			                		}
			                	});
							} catch (ParseException e) {
								showError();
							} catch (IOException e) {
								showError();
							}
			                return null;
			            case HttpStatus.SC_NOT_FOUND:
			            	showError();
			            	return null;
			            default:
			            	showError();
			            	return null;
			            }
				    }
				});
		    }
		    @Override
		    public void onError(Error arg0) {
		        // transaction id が不正等エラーが発生した場合
		        // 購入中断処理
            	appActivity.runOnGLThread(new Runnable() {
            		@Override
            		public void run() {
            			String json = "{\"result\":false,\"error\":\"error\"}";
            			Cocos2dxJavascriptJavaBridge.evalString("Payment.callbackFunc('" + json + "')");
            		}
            	});
		    }
		    @Override
		    public void onCancel() {
		        // ユーザーが購入をキャンセルした場合
		        // 購入中断処理
            	appActivity.runOnGLThread(new Runnable() {
            		@Override
            		public void run() {
            			String json = "{\"result\":false,\"error\":\"cancel\"}";
            			Cocos2dxJavascriptJavaBridge.evalString("Payment.callbackFunc('" + json + "')");
            		}
            	});
		    }
		});
	}
	
	public void post(String url, ArrayList <NameValuePair> params, ResponseHandler<Void> handler) {
		try {
			httpClient = new DefaultHttpClient();
			
			if (cookieStore != null) {
				httpClient.setCookieStore(cookieStore);
			}
			  
			// make post request instance.
			HttpPost postRequest = new HttpPost(baseUrl + url);
			
			if (params.size() > 0) {
				// POST データの設定
				StringEntity paramEntity = null;
				try {
					paramEntity = new UrlEncodedFormEntity(params, "utf-8");
				} catch (UnsupportedEncodingException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
				postRequest.setEntity(paramEntity);
			}
	
			HttpUriRequest request = postRequest;
			
		    httpClient.execute(request, handler);
		} catch (ClientProtocolException e) {
		     e.printStackTrace();
		} catch (IOException e) {
		     e.printStackTrace();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	public boolean isMaintenance(String json) {
		if (json.indexOf("\"maintenance\":true") >= 0) return true;
		return false;
	}
	
	public void goToMaintenance(final String json) {
    	activity.runOnGLThread(new Runnable() {
    		@Override
    		public void run() {
    			Cocos2dxJavascriptJavaBridge.evalString("Configure.maintenanceFromNative('" + json + "')");
    		}
    	});
	}
	
	public void showError() {
		showError("");
	}
	
	public void showError(final String json) {
    	activity.runOnGLThread(new Runnable() {
    		@Override
    		public void run() {
    			String js;
    			if (json.equals("")) {
    				js = "Configure.error()";
    			} else {
    				js = "Configure.error('" + json + "')";
    			}
    			Cocos2dxJavascriptJavaBridge.evalString(js);
    		}
    	});
	}
	
	public void timeout() {
    	activity.runOnGLThread(new Runnable() {
    		@Override
    		public void run() {
    			Cocos2dxJavascriptJavaBridge.evalString("Configure.timeout()");
    		}
    	});
	}
}
