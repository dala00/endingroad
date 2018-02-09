var ShopScene = cc.Scene.extend({
	mainUI: null,
	ui: null,
	
	ctor: function() {
		this._super();

		this.mainUI = new MainUI(this);

		this.ui = createUI('ui/Shop/Shop.json');

		var button1 = this.ui.getChildByName('Button1');
		button1.addTouchEventListener(this.onButton1Click, this);

		var button10 = this.ui.getChildByName('Button10');
		button10.addTouchEventListener(this.onButton10Click, this);
		
		if (Configure.mode == 'Android' && Configure.platform == 'mobage') {
			this.ui.getChildByName('TokushouButton').addTouchEventListener(this.onTokushouButtonClick, this);
		} else if (Configure.mode == 'iOS' && Configure.platform == 'mobage') {
			this.ui.getChildByName('TokushouButton').addTouchEventListener(this.onTokushouButtonClick, this);
		} else {
			this.ui.getChildByName('TokushouButton').setVisible(false);
		}
		
		this.addChild(this.ui);

		Configure.setKeyEvent(this);
	},

	onButton1Click: function(button, type) {
		if (type == 2) {
			var scene = this;
			Payment.start(1, function(json) {
				if (json.result) {
					new MessageBox('購入しました。');
					scene.mainUI.updateHeader();
				} else {
					if (json.error == 'error') {
						new MessageBox('エラーが発生しました。');
					}
				}
			});
		}
	},

	onButton10Click: function(button, type) {
		if (type == 2) {
			var scene = this;
			Payment.start(10, function(json) {
				if (json.result) {
					new MessageBox('購入しました。');
					scene.mainUI.updateHeader();
				} else {
					if (json.error == 'error') {
						new MessageBox('エラーが発生しました。');
					}
				}
			});
		}
	},
	
	onTokushouButtonClick: function(button, type) {
		if (type == 2) {
			if (Configure.mode == 'Android' && Configure.platform == 'mobage') {
				jsb.reflection.callStaticMethod(Configure.activity, 'openLegal', '()V');
			} else if (Configure.mode == 'iOS' && Configure.platform == 'mobage') {
				jsb.reflection.callStaticMethod(Configure.activity, 'openLegal');
			}
		}
	},

	onKeyReleased:function (key, event) {
		if (key == cc.KEY.escape) {
			cc.director.runScene(new cc.TransitionFade(0.25, new StageScene()));
		}
	}
});
