var OtherScene = cc.Scene.extend({
	
	ctor: function() {
		this._super();
		new MainUI(this);

		var buttons = [
           {id: 'News', name: 'お知らせ'},
           {id: 'Message', name: '受信ボックス'},
           {id: 'Config', name: '設定'},
           {id: 'Help', name: 'ヘルプ'},
           {id: 'Credit', name: 'クレジット'}
		];
		if (Configure.platform == 'yahoo') {
			buttons.push({id:'Invite', name:'招待'});
		}
		if (/*Configure.mode == 'Android' && */Configure.platform == 'mobage') {
			buttons.push({id:'Mobage', name:'Mobage'});
			buttons.push({id:'Contact', name:'お問い合わせ'});
		}
		var winSize = cc.director.getWinSizeInPixels();
		
		for (var i = 0; i < buttons.length; i++) {
			var button = new ccui.Button();
			button.setTouchEnabled(true);
			button.setScale9Enabled(true);
			button.loadTextures('pipo-CursorBase001.png', null, null);
			var size = cc.size(400, 40);
			button.setSize(size);
			button.setPosition(winSize.width / 2, 350 - 45 * i);
			button.addTouchEventListener(this['on' + buttons[i].id + 'ButtonClick'], this);
			
			var label = new cc.LabelTTF(buttons[i].name, Configure.font, 16);
			label.setColor(cc.color(0, 0, 0));
			label.setPosition(size.width / 2, size.height / 2);
			button.addChild(label);
			
			this.addChild(button);
		}

		Configure.setKeyEvent(this);
	},

	onNewsButtonClick: function(button, type) {
		if (type == 2) {
			Sound.se('sounds/cursor8.wav');
			cc.director.runScene(new cc.TransitionFade(0.25, new NewsScene()));
		}
	},

	onMessageButtonClick: function(button, type) {
		if (type == 2) {
			Sound.se('sounds/cursor8.wav');
			cc.director.runScene(new cc.TransitionFade(0.25, new MessageScene()));
		}
	},

	onConfigButtonClick: function(button, type) {
		if (type == 2) {
			Sound.se('sounds/cursor8.wav');
			cc.director.runScene(new cc.TransitionFade(0.25, new ConfigScene()));
		}
	},
	
	onHelpButtonClick: function(button, type) {
		if (type == 2) {
			Sound.se('sounds/cursor8.wav');
			cc.director.runScene(new cc.TransitionFade(0.25, new HelpScene()));
		}
	},
	
	onCreditButtonClick: function(button, type) {
		if (type == 2) {
			Sound.se('sounds/cursor8.wav');
			cc.director.runScene(new cc.TransitionFade(0.25, new PageScene('Credit')));
		}
	},

	onMobageButtonClick: function(button, type) {
		if (type == 2) {
			if (Configure.mode == 'Android') {
				jsb.reflection.callStaticMethod(Configure.activity, 'showCommunityUI', '()V');
			} else if (Configure.mode == 'iOS') {
				jsb.reflection.callStaticMethod(Configure.activity, 'showCommunityUI');
			}
		}
	},

	onContactButtonClick: function(button, type) {
		if (type == 2) {
			if (Configure.mode == 'Android') {
				jsb.reflection.callStaticMethod(Configure.activity, 'openContact', '()V');
			} else if (Configure.mode == 'iOS') {
				jsb.reflection.callStaticMethod(Configure.activity, 'openContact');
			}
		}
	},
	
	onInviteButtonClick: function(button, type) {
		if (type == 2) {
			Sound.se('sounds/cursor8.wav');
			cc.director.runScene(new cc.TransitionFade(0.25, new InviteScene()));
		}
	},

	onKeyReleased:function (key, event) {
		if (key == cc.KEY.escape) {
			cc.director.runScene(new cc.TransitionFade(0.25, new StageScene()));
		}
	}
});
