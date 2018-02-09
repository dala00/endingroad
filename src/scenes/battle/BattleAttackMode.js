var BattleAttackMode =  BattleMode.extend({
	currentChara: 0,
	hits: null,
	effectHits: null,
	debuffHits: null,
	positions: null,
	moving: false,
	moveCount: 0,
	
	
	initialize: function() {
		this.moving = false;
		this.currentChara = this.layer.getCurrentChara(0);
		this.layer.setCurrentChara(this.currentChara);
		if (this.layer.characters[this.currentChara].isActionDisable()) {
			this.attackEnd();
		}
	},

	update: function(dt) {
		if (this.moving) {
			this.attackFunc();
		}
	},

	onClick: function(pos) {
		if (this.positions == null) {
			if (pos.x > this.layer.padding && pos.x < this.layer.fieldW
				&& pos.y > this.layer.padding && pos.y < this.layer.fieldH) {
				this.attackStart(pos);
			}
		}
	},

	attackStart: function(pos) {
		var chara = this.layer.characters[this.currentChara];
		chara.setDirectionByPosition(pos);
		this.hits = {};
		this.effectHits = {};
		this.debuffHits = {};
		this.moveCount = 0;
		this.positions = this.layer.getMovePositions(chara, pos);
		if (chara.skill == null) {
			this.attackMovingStart();
		} else {
			chara.useSkill();
			chara.window.setSkillSelectEnabled(false);
			if (chara.skill != null && chara.skill.effect == 'attackUp') {
				this.layer.effect(chara.skill.effectImage, chara.x, chara.y);
			}
			this.layer.skillEffect(chara);
		}
	},
	
	attackMovingStart: function() {
		this.moving = true;
	},
	
	attackFunc: function() {
		var chara = this.layer.characters[this.currentChara];
		var pos = this.positions[this.moveCount];
		chara.setPosition(pos.x, pos.y);
		
		for (var i = 0; i < this.layer.enemies.length; i++) {
			if (this.hits[i] == undefined) {
				var enemy = this.layer.enemies[i];
				if (!enemy.died && enemy.isWithin(chara)) {
					this.hits[i] = true;
					if (chara.isHit(enemy)) {
						var count = 1;
						if (chara.skill != null) {
							if (chara.isUsingDebuffSkill()) {
								if (enemy.addBuff(chara)) {
									this.debuffHits[i] = true;
									if (chara.skill.effectImage != '') {
										this.layer.effect(chara.skill.effectImage, enemy.x, enemy.y);
									}
								}
							}
							var skillEffect = Configure.skillEffects.filter(function (i, no) {return i.id == chara.skill.effect;})[0];
							if (skillEffect.type == 'attacks') {
								count = chara.skill.value;
							}
						}
						for (var j = 0; j < count; j++) {
							var damage = chara.calcDamage(enemy);
							enemy.damage(damage);
							this.layer.damageEffect(enemy, damage, null, j * 0.2);
						}
						Sound.se('sounds/se04.wav');
						if (chara.skill == null || chara.skill.id != 'limit') {
							chara.addLimit(10);
						}
						enemy.addLimit(5);
						if (chara.skill != null && chara.skill.effect == 'attacksOnce') {
							chara.unsetSkill();
						}
						var attr = Configure.attributes.filter(function(i){return i.id == chara.attr})[0];
						var color = cc.color(attr.color);
						this.layer.addChild(new Effect(chara.character.attackEffect, enemy.x, enemy.y, color), this.layer.effectZ);
						if (enemy.died) {
							enemy.disappear();
						}
					} else {
						this.layer.damageEffect(enemy, 'miss');
					}
				}
			}
		}
		
		if (chara.isSkillForMember()) {
			var count = 0;
			for (var i = 0; i < this.layer.characters.length; i++) {
				if (this.effectHits[i] == undefined) {
					var member = this.layer.characters[i];
					if (!member.died && member.isWithin(chara)) {
						var effect = false;
						if (chara.isUsingBuffSkill()) {
							if (member.addBuff(chara)) {
								effect = true;
							}
						} else if (chara.skill.effect == 'heal') {
							var heal = chara.calcHeal(member);
							member.heal(heal);
							effect = true;
							this.layer.damageEffect(member, heal, cc.color(127, 255, 127));
						} else if (chara.skill.effect == 'cure') {
							member.cure();
							effect = true;
						}
						if (effect && chara.skill.effectImage != '') {
							this.layer.effect(chara.skill.effectImage, member.x, member.y);
						}
						this.effectHits[i] = true;
						if (++count >= 4) break;
					}
				}
			}
		}
		
		if (++this.moveCount >= this.positions.length) {
			this.moving = false;
			if (chara.isUsingAttackSkill()) {
				var isAll = (chara.skill.effect.indexOf('All') != -1);
				var x, y;
				if (isAll) {
					x = 320;
					y = 240;
				} else {
					x = chara.x;
					y = chara.y;
				}
				this.layer.effect(chara.skill.effectImage, x, y);
				var rect;
				if (isAll) {
					rect = cc.rect(0, 0, 640, 480);
				} else {
					rect = cc.rect(chara.x - 160, chara.y - 60, 320, 120);
				}
				for (var i = 0; i < this.layer.enemies.length; i++) {
					var enemy = this.layer.enemies[i];
					if (!enemy.died && cc.rectContainsPoint(rect, enemy.getPosition())) {
						var damage = chara.calcDamage(enemy, chara.skill);
						enemy.damage(damage);
						this.layer.damageEffect(enemy, damage, null, 0.5);
						if (enemy.died) {
							enemy.disappear();
						}
					}
				}
				var mode = this;
				setTimeout(function() {
					mode.attackEnd();
				}, 1000);
			} else if (chara.skill != null && chara.skill.effect == 'absorb') {
				this.layer.effect(chara.skill.effectImage, chara.x, chara.y);
				for (var i = 0; i < this.layer.enemies.length; i++) {
					var enemy = this.layer.enemies[i];
					if (!enemy.died) {
						var pos = enemy.getAbsorbPosition(chara);
						enemy.runAction(new cc.EaseOut(new cc.MoveTo(0.5, pos), 3.0));
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
	
	attackEnd: function() {
		var chara = this.layer.characters[this.currentChara];
		if (chara.skill != null && chara.skill.effect == 'sleep') {
			for (var i in this.debuffHits) {
				this.layer.enemies[i].addBuff(chara, true);
			}
		}
		chara.unsetSkill();
		chara.window.setSkillSelectEnabled(true);
		chara.progressSkillCt();
		var damages = chara.progressBuffTurn();
		this.layer.showBuffIconAll(true);
		for (var i = 0; i < damages.length; i++) {
			this.layer.damageEffect(chara, damages[i].damage, damages[i].color, i * 0.5);
		}
		if (chara.died) {
			chara.disappear();
		}
		
		if (this.layer.getEnemyCount() > 0) {
			this.currentChara = this.layer.getCurrentChara(this.currentChara + 1);
			if (this.currentChara == null) {
				this.layer.setCurrentChara(-1);
				this.layer.setMode('enemy');
			} else {
				if (this.layer.characters[this.currentChara].isActionDisable()) {
					this.attackEnd();
					return;
				}
				this.layer.setCurrentChara(this.currentChara);
			}
		} else {
			if (this.layer.phase == this.layer.getPhaseMax()) {
				this.layer.endGame();
			} else {
				this.currentChara = this.layer.getCurrentChara(0);
				this.layer.phase++;
				this.layer.createEnemies();
				this.layer.setMode('showPhase');
			}
		}
		this.positions = null;
	}
});
