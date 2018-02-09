var PageScene = cc.Scene.extend({
	
	ctor: function(page) {
		this._super();
		new MainUI(this);
		
		var ui = createUI('ui/' + page + '/' + page + '.json');
		this.addChild(ui);
	}
});
