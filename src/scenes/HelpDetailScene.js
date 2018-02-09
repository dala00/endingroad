var HelpDetailScene = cc.Scene.extend({
	
	ctor: function(data) {
		this._super();
		this.addChild(createBg(), 0);
		
		var params = {
			Title: data.name,
			Body: Configure.br(data.body)
		};
		if (data.published) {
			params.Date = data.published.substr(0, 16);
		}
		var ui = createUI('ui/Help/Help.json', params);
		if (data.published == undefined) {
			ui.getChildByName('Date').setVisible(false);
		}
		this.addChild(ui);
		
		ui.getChildByName('BackButton').addTouchEventListener(this.onBackButtonClick, this);
		
		var listener = cc.EventListener.create({
			event: cc.EventListener.KEYBOARD,
			onKeyReleased:function (key, event) {
				if (key == cc.KEY.escape) {
					cc.director.popScene();
				}
			}
		});
		cc.eventManager.addListener(listener, this);
	},
	
	onBackButtonClick: function(button, type) {
		if (type == 2) {
			cc.director.popScene();
		}
	}
});
