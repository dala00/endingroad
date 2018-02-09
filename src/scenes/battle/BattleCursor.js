var BattleCursor = cc.Sprite.extend({

	ctor: function() {
		this._super();
		var animation = cc.Animation.create();
		for (var i = 0; i < 6; i++) {
			var rect = cc.rect(0, i * 16, 30, 16);
			var frame = cc.SpriteFrame.create('pipo-Text_Pause001.png', rect);
			animation.addSpriteFrame(frame);
		}
		animation.setDelayPerUnit(0.1);
		var action = cc.RepeatForever.create(cc.Animate.create(animation));
		this.runAction(action);
		this.scheduleUpdate();
	},
	
	update: function(dt) {
		var layer = this.getParent();
		if (layer.mode == 'enemy') {
			var enemy = layer.enemies[layer.modeClass.currentEnemy];
			this.setPosition(enemy.x, enemy.y + 50);
		} else if (layer.mode == 'attack') {
			var chara = layer.characters[layer.modeClass.currentChara];
			this.setPosition(chara.x, chara.y + 50);
		} else {
			this.setPositionX(-50);
		}
	}
});
