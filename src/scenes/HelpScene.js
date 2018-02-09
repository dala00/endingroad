var HelpScene = cc.Scene.extend({

	ctor: function() {
		this._super();
		var mainUI = new MainUI(this);
		
		var winSize = cc.director.getWinSizeInPixels();
		var list = new ccui.ListView();
		list.setDirection(ccui.ScrollView.DIR_VERTICAL);
		list.setGravity(ccui.ListView.GRAVITY_CENTER_HORIZONTAL);
		list.setBounceEnabled(true);
		list.setAnchorPoint(cc.p(0, 0));
		list.setItemsMargin(4);
		list.setContentSize(winSize.width, winSize.height - mainUI.getHeaderHeight());
		var tag = 1;
		for (var i = 0; i < Configure.helpCategories.length; i++) {
			var category = Configure.helpCategories[i];
			var label = new ccui.Text();
			label.setFontSize(22);
			label.setFontName(Configure.font);
			label.setString(category.name);
			label.tag = tag++;
			list.pushBackCustomItem(label);
			for (var j = 0; j < Configure.helps.length; j++) {
				var help = Configure.helps[j];
				if (help.categoryId == category.id) {
					var show = false;
					if (help.mode == '') {
						show = true;
					} else {
						var modes = help.mode.split(',');
						for (var imode = 0; imode < modes.length; imode++) {
							if (modes[imode] == Configure.mode) {
								show = true;
								break;
							}
						}
					}
					if (show) {
						var button = new ccui.Button();
						button.setTouchEnabled(true);
						button.setScale9Enabled(true);
						button.loadTextures('pipo-CursorBase001.png', null, null);
						var size = cc.size(400, 40);
						button.setSize(size);
						button.name = help.id;
						button.addTouchEventListener(this.onButtonClick, this);
	
						var label = new cc.LabelTTF(help.name, Configure.font, 16);
						label.setColor(cc.color(0, 0, 0));
						label.setPosition(size.width / 2, size.height / 2);
						button.addChild(label);
	
						list.pushBackCustomItem(button);
					}
				}
			}
		}
		
		this.addChild(list);

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
	
	onButtonClick: function(button, type) {
		if (type == 2) {
			var help = Configure.helps.filter(function(i){return i.id == button.name;})[0]
			cc.director.pushScene(new cc.TransitionMoveInR(0.25, new HelpDetailScene(help)));
		}
	},

	onKeyReleased:function (key, event) {
		if (key == cc.KEY.escape) {
			cc.director.runScene(new cc.TransitionFade(0.25, new StageScene()));
		}
	}
});
