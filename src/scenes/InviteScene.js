var InviteScene = cc.Scene.extend({
	
	ctor: function(page) {
		this._super();
		new MainUI(this);
		
		var ui = createUI('ui/Invite/Invite.json');
		ui.getChildByName('InviteButton').addTouchEventListener(function(button, type) {
			if (type == 2) {
				var params = {};
				params[opensocial.Message.Field.TITLE] = "エンディングロードへの招待";
				var body = "エンディングロードは簡単クリック操作のレトロRPG！今なら初回10連ガチャが300モバコイン！";
				var message = opensocial.newMessage(body, params);
				opensocial.requestShareApp( "VIEWER_FRIENDS", message, function(response) {  
					if (response.hadError()) {  
						new MessageBox('エラーが発生しました。');
					} else {
						var recipientIds = response.getData()["recipientIds"];
						if (recipientIds.length > 0){
							Communicator.request('invites/add', {ids:recipientIds.join(',')}, function(json) {
								if (json.result) {
									new MessageBox('招待を行いました。');
								} else {
									new MessageBox('処理に失敗しました。');
								}
							});
						}
					}
				});
			}
		});
		this.addChild(ui);
	}
});
