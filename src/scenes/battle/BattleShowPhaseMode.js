var BattleShowPhaseMode = BattleMode.extend({

	initialize: function() {
		var  particle = new cc.ParticleSystem('particles/battle_teropbg.plist');
		particle.setPosition(cc.p(640, 240));
		particle.setScaleY(0.5);
		particle.setAutoRemoveOnFinish(true);
		this.layer.addChild(particle, 1000);
		
		var text = '' + this.layer.phase + ' / ' + this.layer.getPhaseMax();
		var label = new cc.LabelTTF(text, 'Arial', 18);
		var fadeIn = cc.FadeIn.create(0.4);
		var delay = cc.DelayTime.create(0.4);
		var fadeOut = cc.FadeOut.create(0.4);
		var remove = cc.RemoveSelf.create(true);
		var callback = cc.CallFunc.create(this.onComplete, this);
		var sequence = cc.Sequence.create(fadeIn, delay, fadeOut, callback, remove);
		label.runAction(sequence);
		label.setPosition(320, 240);
		label.setColor(cc.color(255, 255, 255));
		label.enableStroke(cc.color(0, 0, 0), Configure.mode == 'Android' ? 3 : 2);
		this.layer.addChild(label, 1100);
	},
	
	onComplete: function() {
		if (this.layer.phase == 1 && this.layer.scene.stageLevel.message != '') {
			var message = this.layer.scene.stageLevel.message;
			if (Configure.mode == 'Windows') {
				message = message.replace('タッチ', 'クリック');
				message = message.replace('タップ', 'クリック');
			}
			new MessageBox(message);
		}
		this.layer.setMode('attack');
	}
});
