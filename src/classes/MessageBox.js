var MessageBox = cc.Layer.extend({
	params: null,
	types: ['Ok', 'YesNo'],
	
	ctor: function(params) {
		this._super();
		if (typeof params == 'string') {
			params = {text:params};
		}
		var replaces = {
			Panel: {
				Label: params.text
			}
		};
		var ui = createUI('ui/MessageBox/MessageBox.json', replaces);
		
		if (params.type == undefined) {
			params.type = 'Ok';
		}
		if (params.dontClose == undefined) {
			params.dontClose == false;
		}
		var panel = ui.getChildByName('Panel');
		var area = panel.getChildByName(params.type + 'ButtonArea');
		for (var i = 0; i < this.types.length; i++) {
			if (this.types[i] != params.type) {
				panel.getChildByName(this.types[i] + 'ButtonArea').setVisible(false);
			}
		}
		
		if (params.type == 'Ok') {
			area.getChildByName('OkButton').addTouchEventListener(this.onOkButtonClick, this);
		} else if (params.type == 'YesNo') {
			area.getChildByName('YesButton').addTouchEventListener(this.onYesButtonClick, this);
			area.getChildByName('NoButton').addTouchEventListener(this.onNoButtonClick, this);
		}
		
		if (Configure.mode == 'Android' && params.legal != undefined && params.legal) {
			panel.getChildByName('TokushouButton').addTouchEventListener(this.onTokushouButtonClick, this);
		} else {
			panel.getChildByName('TokushouButton').setVisible(false);
		}

		this.params = params;
		this.addChild(ui);
		cc.director.getRunningScene().addChild(this, 10000);
	},

	onTokushouButtonClick: function(button, type) {
		if (type == 2) {
			if (Configure.mode == 'Android') {
				jsb.reflection.callStaticMethod(Configure.activity, 'openLegal', '()V');
			} else {
				jsb.reflection.callStaticMethod(Configure.activity, 'openLegal');
			}
		}
	},

	onOkButtonClick: function(button, type) {
		if (type == 2) {
			if (this.params.onOkButtonClick != undefined) {
				this.params.onOkButtonClick();
			}
			cc.director.getRunningScene().removeChild(this);
		}
	},

	onYesButtonClick: function(button, type) {
		if (type == 2) {
			if (this.params.onYesButtonClick != undefined) {
				this.params.onYesButtonClick();
			}
			if (!this.params.dontClose) {
				cc.director.getRunningScene().removeChild(this);
			}
		}
	},

	onNoButtonClick: function(button, type) {
		if (type == 2) {
			if (this.params.onNoButtonClick != undefined) {
				this.params.onNoButtonClick();
			}
			cc.director.getRunningScene().removeChild(this);
		}
	},
	
	close: function() {
		cc.director.getRunningScene().removeChild(this);
	}
});
