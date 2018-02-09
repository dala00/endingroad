var BattleEnemy = BaseCharacter.extend({
	raw: null,

	ctor: function(enemy) {
		BaseCharacter.prototype.ctor.call(this);
		this.raw = enemy;
		this.name = enemy.name;
		this.attr = enemy.attribute;
		this.hp = enemy.hp;
		this.maxHp = this.hp;
		this.attack = enemy.attack;
		this.defence = enemy.defence;
		if (enemy.width != 0) {
			this.imageWidth = enemy.width;
		}
		if (enemy.height != 0) {
			this.imageHeight = enemy.height;
		}
		if (enemy.scale != 0) {
			this.sprite.setScale(enemy.scale);
			this.imageScale = enemy.scale;
		}
		this.createLabel();
		this.parseSkills();
		this.imageCol = enemy.imageCol;
		this.imageRow = enemy.imageRow;
		this.animationCount = enemy.animationCount;
		this.initializeAnimation(enemy.image);
	},
	
	parseSkills: function() {
		this.skills = [];
		if (this.raw.skills == '') return;
		var lines = this.raw.skills.split("\n");
		for (var i = 0; i < lines.length; i++) {
			var params = lines[i].split(',');
			var skill = {};
			skill.id = i;
			skill.name = params[0];
			skill.effect = params[1];
			skill.value = parseFloat(params[2]);
			skill.turn = parseInt(params[3]);
			skill.useRatio = parseInt(params[4]);
			if (params.length < 6 || params[5] == '') {
				var skillEffect = Configure.skillEffects.filter(function(i, no) {return i.id == skill.effect;})[0];
				skill.effectImage = skillEffect.image;
			} else {
				skill.effectImage = params[5];
			}
			if (params.length >= 7) {
				skill.ratio = parseInt(params[6]);
			}
			this.skills.push(skill);
		}
	},
	
	selectSkill: function() {
		for (var i = 0; i < this.buffs.length; i++) {
			if (this.buffs[i].effect == 'skillDisable') {
				return null;
			}
		}
		
		for (var i = 0; i < this.skills.length; i++) {
			var skill = this.skills[i];
			if (random(0, 100) < skill.useRatio) {
				this.skill = skill;
				return this.skill;
			}
		}
		return null;
	},
	
	unsetSkill: function() {
		if (this.skill != null) {
			if (this.skill.id == 'limit') {
				this.limit = 0;
				this.updateLimitGauge();
				this.removeChildByTag(12, true);
			}
			this.skill = null;
		}
	}
});
