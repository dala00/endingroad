var MessageScene = cc.Scene.extend({
	mainUI: null,
	
	ctor: function() {
		this._super();
		var mainUI = new MainUI(this);
		this.mainUI = mainUI;
		var scene = this;
		var now = (new Date()).getTime();
		var winSize = cc.director.getWinSizeInPixels();

		var label = new cc.LabelTTF('受信ボックス', Configure.font, 28);
		label.setPosition(winSize.width / 2, 370);
		this.addChild(label);

		var label = new cc.LabelTTF('100件まで保存されています', Configure.font, 14);
		label.setPosition(650, 360);
		this.addChild(label);

		this.list = new ccui.ListView();
		this.list.setDirection(ccui.ScrollView.DIR_VERTICAL);
		this.list.setBounceEnabled(true);
		this.list.setAnchorPoint(cc.p(0, 0));
		this.list.setItemsMargin(4);
		this.list.setContentSize(winSize.width, winSize.height - mainUI.getHeaderHeight() - 60);
		this.addChild(this.list);

		if (now - Configure.messageChecked > 600000) {
			Communicator.request('messages', null, function(json) {
				Configure.messages = json.messages;
				Configure.messageChecked = now;
				scene.showMessages();
			});
		} else {
			this.showMessages();
		}
		
		var list = this.list;
		if (Configure.mode == 'Windows') {
			var event = new cc._EventListenerMouse();
			event.onMouseScroll = function(event) {
				var minY = list._contentSize.height - list._innerContainer.getContentSize().height;
				var h = -minY;
				if (h > 0) {
					var current = list._innerContainer.getPositionY() - event.getScrollY();
					var per = (current - minY) * 100 / h;
					list.scrollToPercentVertical(per, 0.1, true);
				}
			};
			cc.eventManager.addListener(event, this);
		}

		Configure.setKeyEvent(this);
	},

	showMessages: function() {
		var winSize = cc.director.getWinSizeInPixels();
		for (var i = 0; i < Configure.messages.length; i++) {
			var row = Configure.messages[i];
			var button = new ccui.Button();
			button.setTouchEnabled(true);
			button.setScale9Enabled(true);
			button.loadTextures('pipo-CursorBase001.png', null, null);
			var size = cc.size(winSize.width - 20, 40);
			button.setSize(size);
			button.name = row.id;
			button.addTouchEventListener(this.onButtonClick, this);

			if (!row.received) {
				var label = new NewLabel();
				label.setPosition(30, size.height / 2);
				label.setName('New');
				button.addChild(label);
			}
			
			var label = new cc.LabelTTF(row.name, Configure.font, 16);
			label.setColor(cc.color(0, 0, 0));
			label.setPosition(size.width / 2, size.height / 2);
			button.addChild(label);

			var date = new cc.LabelTTF(row.created.substr(0, 16), Configure.font, 16);
			date.setColor(cc.color(0, 0, 0));
			var dateSize = date.getContentSize();
			date.setPosition(size.width - dateSize.width / 2 - 10, size.height / 2);
			button.addChild(date);

			this.list.pushBackCustomItem(button);
		}
	},

	onButtonClick: function(button, type) {
		if (type == 2) {
			var scene = this;
			var row = Configure.messages.filter(function(i){return i.id == button.name;})[0]
			var body = Configure.br(row.body);
			if (row.item_id > 0) {
				var item = Configure.items.filter(function(i){return i.id == row.item_id;})[0];
				body += "\n\nプレゼント : " + item.name + ' x ' + row.number;
			} else if (row.gold > 0) {
				body += "\n\nプレゼント : " + row.gold + 'ココ';
			} else if (row.stone > 0) {
				body += "\n\nプレゼント : 宝玉" + row.stone;
			}
			var params = {Panel: {
				Name: row.name,
				Date: row.created.substr(0, 16),
				Body: body
			}};
			var ui = createUI('ui/Message/Message.json', params);
			this.addChild(ui, 100);
			
			ui.getChildByName('Panel').getChildByName('CloseButton').addTouchEventListener(function(button, type) {
				if (type == 2) {
					scene.removeChild(ui, true);
				}
			});
			
			if (!row.received) {
				Communicator.request('messages/receive', {id: row.id}, function(json) {
					if (json.result) {
						row.received = true;
						button.removeChild(button.getChildByName('New'), true);
						if (row.item_id > 0 && json.usersItems != undefined) {
							Configure.updateUsersItems(json.usersItems);
							new MessageBox('アイテムを受信しました。');
						} else if (row.gold > 0) {
							scene.mainUI.updateHeader();
							new MessageBox('ココを受信しました。');
						} else if (row.stone > 0) {
							scene.mainUI.updateHeader();
							new MessageBox('宝玉を受信しました。');
						}
					} else {
						new MessageBox('エラーが発生しました。');
					}
				});
			}
		}
	},

	onKeyReleased:function (key, event) {
		if (key == cc.KEY.escape) {
			cc.director.runScene(new cc.TransitionFade(0.25, new StageScene()));
		}
	}
});
