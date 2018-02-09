var BattleCharacter = BaseCharacter.extend({
	usersCharacter: null,
	character: null,
	window: null,
	ct: null,
	
	ctor: function(usersCharacter) {
		BaseCharacter.prototype.ctor.call(this);
		this.usersCharacter = usersCharacter;
		this.character = Configure.characters.filter(function(item, index) {
			if (item.id == usersCharacter.character_id) return true;
		})[0];
		this.name = this.character.name;
		this.attr = this.character.attribute;
		this.hp = usersCharacter.hp;
		this.maxHp = this.hp;
		this.attack = usersCharacter.attack;
		this.defence = usersCharacter.defence;
		
		this.skills = Configure.skills.filter(function(item, index) {
			return item.characterId == usersCharacter.character_id && item.level <= usersCharacter.level;
		});
		this.ct = {};
		for (var i = 0; i < this.skills.length; i++) {
			var skill = this.skills[i];
			this.ct[skill.id] = 0;
			if (skill.effectImage == '') {
				var skillEffect = Configure.skillEffects.filter(function(i, no) {return i.id == skill.effect;})[0];
				if (skillEffect != null) {
					skill.effectImage = skillEffect.image;
				}
			}
		}
		
		if (this.character.width != 0) this.imageWidth = this.character.width;
		if (this.character.height != 0) this.imageHeight = this.character.height;
		if (this.character.scale != 0) {
			this.sprite.setScale(this.character.scale);
			this.imageScale = this.character.scale;
		}
		if (this.character.imageCol !== null) this.imageCol = this.character.imageCol;
		if (this.character.imageRow !== null) this.imageRow = this.character.imageRow;
		this.animationCount = this.character.animationCount;
		this.initializeAnimation(this.character.image);
		this.createLabel();
	},
	
	updateHpGauge: function() {
		BaseCharacter.prototype.updateHpGauge.call(this);
		this.window.updateHp();
	},
	
	updateLimitGauge: function() {
		BaseCharacter.prototype.updateLimitGauge.call(this);
		this.window.showLimitButton(this.limit == 100);
	},
	
	selectSkill: function(no) {
		if (no == 'limit') {
			if (this.skill != null && this.skill.id == 'limit') {
				this.skill = null;
			} else {
				this.selectLimitSkill(this.character.limitSkillName);
			}
		} else {
			if (this.skill != null && this.skill.id == this.skills[no].id) {
				this.skill = null;
			} else {
				this.skill = this.skills[no];
			}
		}
		return this.skill;
	},
	
	useSkill: function() {
		if (this.skill.id != 'limit') {
			this.ct[this.skill.id] = this.skill.ct;
		}
		if (this.skill.effect == 'hide') {
			this.addBuff(this);
			this.sprite.runAction(new cc.FadeTo(0.5, 64));
		}
		this.window.updateCT();
	},
	
	unsetSkill: function() {
		if (this.skill != null) {
			if (this.skill.id == 'limit') {
				this.limit = 0;
				this.updateLimitGauge();
				this.removeChildByTag(12, true);
				this.window.showLimitButton(false);
				this.window.skillName.setString('');
			} else {
				for (var i = 0; i < this.skills.length; i++) {
					if (this.skill == this.skills[i]) {
						this.window.enableSkillButton(i, false);
						this.window.skillName.setString('');
						break;
					}
				}
			}
			this.skill = null;
		}
	},
	
	progressSkillCt: function() {
		for (var i = 0; i < this.skills.length; i++) {
			var skill = this.skills[i];
			if (this.ct[skill.id] > 0) {
				if (--this.ct[skill.id] == 0) {
					this.window.enableSkillButton(i, true);
				}
			}
		}
		this.window.updateCT();
	},

	revive: function() {
		BaseCharacter.prototype.revive.call(this);
		this.window.skillName.setString('');
	}
});
