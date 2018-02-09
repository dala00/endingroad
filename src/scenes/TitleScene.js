var TitleScene = cc.Scene.extend({
	onEnter:function () {
		this._super();
		var ui = ccs.uiReader.widgetFromJsonFile("ui/TitleUi_1/TitleUi_1.json");
		this.addChild(ui, 1);
		var scene = this;
		Configure.loading('title', true);
		Sound.initialize();
		Sound.bgm('sounds/tamhe07.mp3', true);
		
		if (Configure.mode == 'Android' && Configure.platform == 'mobage') {
			Configure.loadDataFirst = true;
		}
		Configure.loadData(function() {
			Configure.loadingEnd('title');
			
			var label = new cc.LabelTTF(Configure.mode == 'Windows' ? 'Click to start' : 'Touch to start', Configure.font, 16);
			label.setColor(cc.color(255, 255, 255));
			label.setPosition(cc.winSize.width / 2, cc.winSize.height / 3);
			label.enableStroke(cc.color(0, 0, 0), 1);
			label.runAction(new cc.RepeatForever(new cc.Sequence(
				new cc.DelayTime(0.5),
				new cc.FadeOut(0.25),
				new cc.FadeIn(0.25)
			)));
			scene.addChild(label, 2);
			
			var touch = cc.EventListener.create({
				event: cc.EventListener.TOUCH_ALL_AT_ONCE,
				swallowTouches: true,                
				onTouchesBegan:function (touches, event) {
					if (Configure.user != null) {
						cc.director.runScene(new cc.TransitionFade(1.0, new NewsScene()));
					} else {
						cc.director.runScene(new cc.TransitionFade(1.0, new OpeningScene()));
					}
				}
			});
			cc.eventManager.addListener(touch, scene);
		});
		
		Configure.setKeyEvent(this);
	},

	onKeyReleased:function (key, event) {
		if (key == cc.KEY.escape) {
			cc.director.end();
		}
	}
	
	/*onExitTransitionDidStart onExit :function(){
//		this.removeAllChildren();
//		Configure.releaseUI('ui/TitleUi_1/TitleUi_1.json');
	}
	*/
});

