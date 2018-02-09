var NewsScene = cc.Scene.extend({
	list: null,
	
	ctor: function() {
		this._super();
		this.addChild(createBg(), 0);

		var scene = this;
		var now = (new Date()).getTime();
		var winSize = cc.director.getWinSizeInPixels();
		
		var label = new cc.LabelTTF('お知らせ', Configure.font, 28);
		label.setPosition(winSize.width / 2, 450);
		this.addChild(label);
		
		var button = new ccui.Button();
		button.setTouchEnabled(true);
		button.setScale9Enabled(true);
		button.loadTextures('pipo-CursorBase001.png', null, null);
		var size = cc.size(120, 40);
		button.setSize(size);
		button.setPosition(winSize.width - 70, winSize.height - 30);
		button.addTouchEventListener(this.onCloseButtonClick, this);
		var label = new cc.LabelTTF('メイン画面へ', Configure.font, 16);
		label.setColor(cc.color(0, 0, 0));
		label.setPosition(size.width / 2, size.height / 2);
		button.addChild(label);
		this.addChild(button);
		
		this.list = new ccui.ListView();
		this.list.setDirection(ccui.ScrollView.DIR_VERTICAL);
		this.list.setBounceEnabled(true);
		this.list.setAnchorPoint(cc.p(0, 0));
		this.list.setItemsMargin(4);
		this.list.setContentSize(winSize.width, winSize.height - 70);
		this.addChild(this.list);
		
		if (Configure.news == null || now - Configure.newsChecked > 600000) {
			Communicator.request('news', null, function(json) {
				Configure.news = json.news;
				Configure.newsChecked = now;
				scene.showNews();
			});
		} else {
			this.showNews();
		}

		Configure.setKeyEvent(this);
	},
	
	showNews: function() {
		var winSize = cc.director.getWinSizeInPixels();
		for (var i = 0; i < Configure.news.length; i++) {
			var row = Configure.news[i];
			var button = new ccui.Button();
			button.setTouchEnabled(true);
			button.setScale9Enabled(true);
			button.loadTextures('pipo-CursorBase001.png', null, null);
			var size = cc.size(winSize.width - 20, 40);
			button.setSize(size);
			button.name = row.id;
			button.addTouchEventListener(this.onButtonClick, this);

			var label = new cc.LabelTTF(row.name, Configure.font, 16);
			label.setColor(cc.color(0, 0, 0));
			label.setPosition(size.width / 2, size.height / 2);
			button.addChild(label);
			
			var date = new cc.LabelTTF(row.published.substr(0, 16), Configure.font, 16);
			date.setColor(cc.color(0, 0, 0));
			var dateSize = date.getContentSize();
			date.setPosition(size.width - dateSize.width / 2 - 10, size.height / 2);
			button.addChild(date);

			this.list.pushBackCustomItem(button);
		}
	},
	
	onButtonClick: function(button, type) {
		if (type == 2) {
			var row = Configure.news.filter(function(i){return i.id == button.name;})[0]
			cc.director.pushScene(new cc.TransitionMoveInR(0.25, new HelpDetailScene(row)));
		}
	},
	
	onCloseButtonClick: function(button, type) {
		if (type == 2) {
			cc.director.runScene(new cc.TransitionFade(0.25, new StageScene()));
		}
	},

	onKeyReleased:function (key, event) {
		if (key == cc.KEY.escape) {
			cc.director.runScene(new cc.TransitionFade(0.25, new StageScene()));
		}
	}
});
