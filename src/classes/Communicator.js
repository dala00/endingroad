var Communicator = {
	callbackForPost: null,

	request: function(url, params, callback) {
		Configure.loading();
		this.post(url, params, function(data) {
			Configure.loadCommonData(data);
			Configure.loadingEnd();
			callback(data);
		});
	},
	
	post: function(url, data, callback) {
		if (Configure.mode == 'Windows' && Configure.platform == 'yahoo') {
			var params = {};
			params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.POST;
			params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON;
			if (data != null) {
				params[gadgets.io.RequestParameters.POST_DATA] = gadgets.io.encodeValues(data);
			}
			params[gadgets.io.RequestParameters.AUTHORIZATION] = gadgets.io.AuthorizationType.SIGNED;
			gadgets.io.makeRequest(Configure.baseUrl + url, function(data) {
				callback(data.data);
			}, params);
		} else if (Configure.platform == 'mobage') {
			this.callbackForPost = callback;
			var parts = [];
			for (var key in data) {
				parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
			}
			if (Configure.mode == 'Android') {
				jsb.reflection.callStaticMethod(
					Configure.activity,
					'post',
					'(Ljava/lang/String;Ljava/lang/String;)V',
					url,
					parts.join('&')
				);
			} else if (Configure.mode == 'iOS') {
				jsb.reflection.callStaticMethod(
					Configure.activity,
					'post:parameters:',
					url,
					parts.join('&')
				);
			}
		} else {
			if (data == null) {
				data = {};
			}
			var parts = [];
			for (var key in data) {
				parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
			}
			var obj = new XMLHttpRequest();
			obj.open('POST', Configure.baseUrl + url, true);
			obj.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			obj.send(parts.join('&'));
			obj.onreadystatechange = function() {
				if (obj.readyState == 4) {
					var res = obj.responseText;
					var json = JSON.parse(obj.responseText);
					callback(json);
				}
			}
		}
	},
	
	postCallback: function(jsonString) {
		var json = JSON.parse(jsonString);
		jsonString = null;
		this.callbackForPost(json);
	},
	
	getItem: function(key, defaultValue) {
		var value;
		if (defaultValue == undefined) {
			defaultValue = null;
		}
		try {
			value = cc.sys.localStorage.getItem(key);
			if (value == null || value == '') {
				value = defaultValue;
			}
		} catch (e) {
			value = defaultValue;
		}
		return value;
	},
	
	setItem: function(key, value) {
		try {
			cc.sys.localStorage.setItem(key, value);
		} catch (e) {
		}
	},
	
	debug: function(str) {
		var obj = new XMLHttpRequest();
		obj.open('POST', Configure.baseUrl + 'menu/webdump', true);
		obj.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		obj.send('str=' + encodeURIComponent(str));
		obj.onreadystatechange = function() {
		}
	}
}
