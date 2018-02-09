var MaintenanceScene = cc.Scene.extend({
	
	ctor: function(message) {
		this._super();
		
		Sound.setEnabled(false);
		
		var params = {Label: Configure.br(message)};
		var ui = createUI('ui/Maintenance/Maintenance.json', params);
		this.addChild(ui);

		if (Configure.platform == 'mobage') {
			ui.getChildByName('Button_2').addTouchEventListener(function(button, type) {
				if (type == 2) {
					if (Configure.mode == 'Android') {
						jsb.reflection.callStaticMethod(Configure.activity, 'openContact', '()V');
					} else if (Configure.mode == 'iOS') {
						jsb.reflection.callStaticMethod(Configure.activity, 'openContact');
					}
				}
			});
		} else {
			ui.getChildByName('Button_2').setVisible(false);
		}
		
		Configure.setKeyEvent(this);
	},
	
	onKeyReleased: function(key, event) {
		if (key == cc.KEY.escape) {
			cc.director.end();
		}
	}
});
