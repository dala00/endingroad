var NewLabel = cc.LabelTTF.extend({
	
	ctor: function() {
		this._super();
		this.initWithString('new', Configure.font, 12);
		this.setColor(cc.color(255, 0, 0));
		this.runAction(
			new cc.RepeatForever(
				new cc.Sequence(
					new cc.DelayTime(2),
					new cc.JumpBy(0.5, cc.p(0, 0), 4, 1)
				)
			)
		);
	}
});
