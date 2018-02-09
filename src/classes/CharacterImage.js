var CharacterImage = cc.Sprite.extend({
	
	ctor: function(character, dir) {
		this._super();
		if (dir == undefined) {
			dir = 0;
		}
		var animation = cc.Animation.create();
		var image = character.image;
		var width = character.width;
		var height = character.height;
		if (width == 0) {
			width = 32;
		}
		if (height == 0) {
			height = 32;
		}
		if (character.scale != 0) {
			this.setScale(character.scale);
		}
		var filename = 'characters/' + image + '.png';
		if (character.imageCol != null) {
			var x = width * character.imageCol;
			for (var i = 0; i < character.animationCount; i++) {
				var rect = cc.rect(x, height * i, width, height);
				animation.addSpriteFrame(new cc.SpriteFrame(filename, rect));
			}
		} else if (character.imageRow != null) {
			var y = height * character.imageRow;
			for (var i = 0; i < character.animationCount; i++) {
				var rect = cc.rect(width * i, y, width, height);
				animation.addSpriteFrame(new cc.SpriteFrame(filename, rect));
			}
		} else {
			var y = dir * height;
			var frame0 = cc.SpriteFrame.create(filename, cc.rect(0, y, width, height));
			var frame1 = cc.SpriteFrame.create(filename, cc.rect(width, y, width, height));
			var frame2 = cc.SpriteFrame.create(filename, cc.rect(width * 2, y, width, height));
			animation.addSpriteFrame(frame1);
			animation.addSpriteFrame(frame0);
			animation.addSpriteFrame(frame1);
			animation.addSpriteFrame(frame2);
		}
		animation.setDelayPerUnit(0.5);
		var action = cc.Animate.create(animation);
		this.runAction(cc.RepeatForever.create(action));
	}
});
