var Effect = cc.Sprite.extend({

	ctor: function(image, x, y, color) {
		this._super();
		this.setPosition(x, y);
		if (color != undefined) {
			this.setColor(color);
		}
		var parts = image.split('.');
		var ext = '.png';
		if (parts.length > 1) {
			ext = '.' + parts[parts.length - 1];
			image = image.replace(ext, '');
		}
		var effect = Configure.effects.filter(function(i, no) {return i.id == image;})[0];
		var animation = cc.Animation.create();
		var currentX = 0;
		var currentY = 0;
		image += ext;
		var filename = 'effects/' + image;
		while (currentY < effect.height) {
			var rect = cc.rect(currentX, currentY, effect.partWidth, effect.partHeight);
			var frame = cc.SpriteFrame.create(filename, rect);
			animation.addSpriteFrame(frame);
			currentX += effect.partWidth;
			if (currentX >= effect.width) {
				currentX = 0;
				currentY += effect.partHeight; 
			}
		}
		animation.setDelayPerUnit(0.05);
		var action = cc.Animate.create(animation);
		var sequence = cc.Sequence.create(action, cc.RemoveSelf.create(true));
		this.runAction(sequence);
	}
});
