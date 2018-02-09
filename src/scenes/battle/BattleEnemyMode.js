var BattleEnemyMode =  BattleMode.extend({
	currentEnemy: 0,
	hits: null,
	effectHits: null,
	debuffHits: null,
	positions: null,
	moveCount: 0,
	moving: false,
	currentCharaMax: 0,
	died: null,
	
	initialize: function() {
		this.currentEnemy = this.layer.getCurrentEnemy(0);
		this.currentCharaMax = this.layer.getCurrentCharaMax();
		this.died = [];
		this.attackStart();
	},

	update: function(dt) {
		if (this.moving) {
			this.attackFunc();
		}
	},

	attackStart: function() {
		var enemy = this.layer.enemies[this.currentEnemy];
		if (enemy.isActionDisable()) {
			this.attackEnd();
			return;
		}
		
		var target = this.getRandomTarget();
		if (target == null) {
			this.attackEnd();
			return;
		}
		var chara = this.layer.characters[target];

		var dx = chara.x - enemy.x;
		var dy = chara.y - enemy.y;
		var rad = Math.atan2(dy, dx);
		var distance = Math.sqrt(dx * dx + dy * dy);
		distance += 40;
		var x = enemy.x + Math.floor(distance * Math.cos(rad));
		var y = enemy.y + Math.floor(distance * Math.sin(rad));
		var pos = {
			x: Math.max(Math.min(x + random(-5, 5), this.layer.fieldW), this.layer.padding),
			y: Math.max(Math.min(y + random(-5, 5), this.layer.fieldH), this.layer.padding)
		};
		
		enemy.setDirectionByPosition(pos);
		this.hits = {};
		this.effectHits = {};
		this.debuffHits = {};
		this.moveCount = 0;
		this.positions = this.layer.getMovePositions(enemy, pos);
		if (enemy.limit == 100) {
			enemy.selectLimitSkill(enemy.raw.limitSkillName);
			this.layer.skillEffect(enemy, cc.color(32, 32, 32));
			this.layer.effect(enemy.skill.effectImage, enemy.x, enemy.y);
		} else {
			var skill = enemy.selectSkill();
			if (skill != null) {
				this.layer.skillEffect(enemy, cc.color(32, 32, 32));
			} else {
				this.attackMovingStart();
			}
		}
	},

	attackMovingStart: function() {
		this.moving = true;
	},
	
	attackFunc: function() {
		var enemy = this.layer.enemies[this.currentEnemy];
		var pos = this.positions[this.moveCount];
		enemy.setPosition(pos.x, pos.y);

		for (var i = 0; i <= this.currentCharaMax; i++) {
			if (this.hits[i] == undefined) {
				var chara = this.layer.characters[i];
				if (!chara.died && chara.isWithin(enemy)) {
					this.hits[i] = true;
					if (enemy.isHit(chara)) {
						var count = 1;
						if (enemy.skill != null) {
							if (enemy.isUsingDebuffSkill()) {
								if (chara.addBuff(enemy)) {
									this.debuffHits[i] = true;
									if (enemy.skill.effectImage != '') {
										this.layer.effect(enemy.skill.effectImage, chara.x, chara.y);
									}
								}
							}
							var skillEffect = Configure.skillEffects.filter(function (i, no) {return i.id == enemy.skill.effect;})[0];
							if (skillEffect.type == 'attacks') {
								count = enemy.skill.value;
							}
						}
						if (!chara.buffExists('hide')) {
							for (var j = 0; j < count; j++) {
								var damage = enemy.calcDamage(chara);
								chara.damage(damage);
								this.layer.damageEffect(chara, damage, null, j * 0.2);
							}
							Sound.se('sounds/se04.wav');
							if (enemy.skill == null || enemy.skill.id != 'limit') {
								enemy.addLimit(10);
							}
							chara.addLimit(5);
							if (enemy.skill != null && enemy.skill.effect == 'attacksOnce') {
								enemy.unsetSkill();
							}
							var attr = Configure.attributes.filter(function(i){return i.id == enemy.attr})[0];
							var color = cc.color(attr.color);
							this.layer.addChild(new Effect('pipo-btleffect005', chara.x, chara.y, color), this.layer.effectZ);
							if (chara.died) {
								chara.disappear();
								this.died.push(i);
							}
						}
					} else {
						this.layer.damageEffect(chara, 'miss');
					}
				}
			}
		}

		if (enemy.isSkillForMember()) {
			for (var i = 0; i < this.layer.enemies.length; i++) {
				if (this.effectHits[i] == undefined) {
					var member = this.layer.enemies[i];
					if (!member.died && member.isWithin(enemy)) {
						var effect = false;
						if (enemy.isUsingBuffSkill()) {
							member.addBuff(enemy);
							effect = true;
						} else if (enemy.skill.effect == 'heal') {
							var heal = enemy.calcHeal(member);
							member.heal(heal);
							effect = true;
							this.layer.damageEffect(member, heal, cc.color(127, 255, 127));
						}
						if (effect && enemy.skill.effectImage != '') {
							this.layer.effect(enemy.skill.effectImage, member.x, member.y);
						}
						this.effectHits[i] = true;
					}
				}
			}
		}

		if (++this.moveCount >= this.positions.length) {
			this.moving = false;
			if (enemy.isUsingAttackSkill()) {
				this.layer.effect(enemy.skill.effectImage, enemy.x, enemy.y);
				var rect = cc.rect(enemy.x - 160, enemy.y - 60, 320, 120);
				for (var i = 0; i <= this.currentCharaMax; i++) {
					var chara = this.layer.characters[i];
					if (!chara.died && cc.rectContainsPoint(rect, chara.getPosition()) && !chara.buffExists('hide')) {
						var damage = enemy.calcDamage(chara, enemy.skill);
						chara.damage(damage);
						this.layer.damageEffect(chara, damage);
						if (chara.died) {
							chara.disappear();
							this.died.push(i);
						}
					}
				}
				var mode = this;
				setTimeout(function() {
					mode.attackEnd();
				}, 1000);
			} else if (enemy.skill != null && enemy.skill.effect == 'absorb') {
				this.layer.effect(enemy.skill.effectImage, enemy.x, enemy.y);
				for (var i = 0; i < this.layer.characters.length; i++) {
					var chara = this.layer.characters[i];
					if (!chara.died) {
						var pos = chara.getAbsorbPosition(enemy);
						chara.runAction(new cc.EaseOut(new cc.MoveTo(0.5, pos), 3.0));
					}
				}
				var mode = this;
				setTimeout(function() {
					mode.attackEnd();
				}, 1000);
			} else {
				this.attackEnd();
			}
		}
	},
	
	getRandomTarget: function() {
		var indexes = [];
		for (var i = 0; i <= this.currentCharaMax; i++) {
			if (!this.layer.characters[i].died) {
				indexes.push(i);
				if (indexes.length >= 4) break;
			}
		}
		if (indexes.length == 0) {
			return null;
		}
		return indexes[random(0, indexes.length - 1)];
	},

	attackEnd: function() {
		var enemy = this.layer.enemies[this.currentEnemy];
		if (enemy.skill != null && enemy.skill.effect == 'sleep') {
			for (var i in this.debuffHits) {
				this.layer.characters[i].addBuff(enemy, true);
			}
		}
		enemy.unsetSkill();
		var damages = enemy.progressBuffTurn();
		this.layer.showBuffIconAll(true);
		for (var i = 0; i < damages.length; i++) {
			this.layer.damageEffect(enemy, damages[i].damage, damages[i].color, i * 0.5);
		}
		if (enemy.died) {
			enemy.disappear();
		}
		
		if (this.layer.getCharaCount() == 0) {
			this.layer.lose();
			return;
		}
		
		this.currentEnemy = this.layer.getCurrentEnemy(this.currentEnemy + 1);
		this.positions = null;
		if (this.layer.getEnemyCount() == 0) {
			if (this.layer.phase == this.layer.getPhaseMax()) {
				this.layer.endGame();
				return;
			}
			this.currentEnemy = null;
		}
		if (this.currentEnemy == null) {
			if (this.died.length == 0) {
				this.layer.setMode('attack');
			} else {
				var params = {
					died: this.died,
					currentCharaMax: this.currentCharaMax
				}
				this.layer.setMode('characterAppear', params);
			}
		} else {
			this.attackStart();
		}
	}
});
