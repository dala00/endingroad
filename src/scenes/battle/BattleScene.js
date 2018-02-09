var BattleScene = cc.Scene.extend({
	usersCharacters: null,
	stageLevel: null,
	enemies: null,
	layer: null,
	ui: null,
	
	ctor: function(usersCharacters, stageLevel, enemies) {
		this._super();
		this.usersCharacters = usersCharacters;
		this.stageLevel = stageLevel;
		this.enemies = enemies;
		var bgm = 'Fairwind_loop.ogg';
		if (stageLevel.bgm != '') {
			bgm = stageLevel.bgm;
		}
		Sound.bgm('sounds/' + bgm);
		Configure.setKeyEvent(this);

		var resources = [];
		for (var i = 0; i < this.enemies.length; i++) {
			resources.push('characters/' + this.enemies[i].image + '.png');
		}
		for (var i = 0; i < usersCharacters.length; i++) {
			var usersCharacter = usersCharacters[i];
			var skills = Configure.skills.filter(function(i) {
				return i.characterId == usersCharacter.character_id && i.level <= usersCharacter.level;
			});
			for (var j = 0; j < skills.length; j++) {
				var skill = skills[j];
				if (skill.effectImage == '') {
					var skillEffect = Configure.skillEffects.filter(function(i) {return i.id == skill.effect;})[0];
					if (skillEffect != null) {
						skill.effectImage = skillEffect.image;
					}
				}
				if (skill.effectImage != '') {
					var image = skill.effectImage;
					if (image.indexOf('.') == -1) {
						image += '.png';
					}
					var parts = image.split('.');
					if (parts[parts.length - 1] != 'plist') {
						cc.textureCache.addImage('effects/' + image);
					}
				}
			}
		}
		cc.textureCache.addImage('clear.png');
		
		var scene = this;
		cc.loader.load(resources, function(err) {
			scene.onImageLoaded();
		});
	},
	
	onImageLoaded: function() {
		this.layer = new BattleLayer(this, this.usersCharacters, this.stageLevel);
		this.addChild(this.layer, 0);
	},
	
	onKeyReleased: function(key, event) {
		
	}
});
