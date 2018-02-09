var ConfigScene = cc.Scene.extend({
	ui: null,

	ctor: function() {
		this._super();
		var mainUI = new MainUI(this);
		
		this.ui = createUI('ui/Config/Config.json');
		var checkbox = this.ui.getChildByName('SoundEnabled');
		checkbox.setSelected(Sound.getEnabled());
		checkbox.addEventListener(this.onSoundEnabledEvent, this);
		this.addChild(this.ui);

		Configure.setKeyEvent(this);
	},
	
	onSoundEnabledEvent: function(checkbox, event) {
		if (event == ccui.CheckBox.EVENT_SELECTED) {
			Sound.setEnabled(true);
		} else if (event == ccui.CheckBox.EVENT_UNSELECTED) {
			Sound.setEnabled(false);
		}
	},

	onKeyReleased:function (key, event) {
		if (key == cc.KEY.escape) {
			cc.director.runScene(new cc.TransitionFade(0.25, new StageScene()));
		}
	}
});
