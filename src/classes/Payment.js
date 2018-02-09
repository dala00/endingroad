var Payment = {
	callback: null,
		
	start: function(id, callback) {
		Configure.loading('payment');
		if (Configure.platform == 'yahoo') {
			this.startYahoo(id, callback);
		} else if (Configure.mode == 'Android' && Configure.platform == 'mobage') {
			this.startMobageAndroid(id, callback);
		} else if (Configure.mode == 'iOS' && Configure.platform == 'mobage') {
			this.startMobageiOS(id, callback);
		} else {
			this.startTest(id, callback);
		}
	},
		
	startYahoo: function(id, callback) {
		var itemParams = {};
		if (Configure.paymentItems[id] == undefined) return;
		var itemData = Configure.paymentItems[id];
		itemParams[opensocial.BillingItem.Field.SKU_ID] = id;
		itemParams[opensocial.BillingItem.Field.PRICE] = itemData.price;
		itemParams[opensocial.BillingItem.Field.COUNT] = 1;
		itemParams[mbga.BillingItem.Field.NAME] = itemData.name;
		itemParams[mbga.BillingItem.Field.IMAGE_URL] = Configure.baseUrl + itemData.image;
		var item = opensocial.newBillingItem(itemParams);

		var params = {};
		params[opensocial.Payment.Field.ITEMS]  = [item];
		params[opensocial.Payment.Field.AMOUNT] = itemData.price;
		var payment = opensocial.newPayment(params);
		opensocial.requestPayment(payment, function(response) {
			if (response.hadError()) {
				Configure.loadingEnd('payment');
			} else {
				var payment = response.getData();
				var orderId = payment.getField(opensocial.Payment.Field.ORDER_ID);
				Communicator.request('payments/check', {orderId:orderId}, function(json) {
					Configure.loadingEnd('payment');
					callback(json);
				});
			}
		});
	},
	
	startMobageAndroid: function(id, callback) {
		id = '' + id;
		this.callback = callback;
		jsb.reflection.callStaticMethod(
			Configure.activity,
			'payment',
			'(Ljava/lang/String;)V',
			id
		);
	},
	
	startMobageiOS: function(id, callback) {
		id = '' + id;
		this.callback = callback;
		jsb.reflection.callStaticMethod(
			Configure.activity,
			'payment:',
			id
		);
	},
	
	callbackFunc: function(jsonString) {
		Configure.loadingEnd('payment');
		var json;
		if (jsonString == '') {
			json = {result:false};
		} else {
			json = JSON.parse(jsonString);
		}
		Configure.loadCommonData(json);
		this.callback(json);
	},
	
	startTest: function(id, callback) {
		Communicator.request('payments/gachaTest', {itemId: id}, function(json) {
			Configure.loadingEnd('payment');
			callback(json);
		});
	},
	
	useStone: function(mode, callback) {
		Communicator.request('users/useStone', {mode:mode}, function(json) {
			callback(json);
		});
	}
};
