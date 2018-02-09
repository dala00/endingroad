var BattleCharacterAppearMode =  BattleMode.extend({
	appears: null,
	appearNo: 0,
	
	initialize: function(params) {
		this.appears = [];
		this.appearNo = 0;
		for (var i = params.currentCharaMax + 1; i < this.layer.characters.length; i++) {
			this.appears.push(this.layer.characters[i]);
			if (params.died == undefined) {
				if (i == 3) break;
			} else {
				if (this.appears.length == params.died.length) break;
			}
		}
		
		if (params.died != undefined) {
			for (var i = 0; i < params.died.length; i++) {
				this.layer.characters[params.died[i]].window.setVisible(false);
			}
		}
		
		var y = 420;
		for (var i = 0; i < this.layer.characters.length; i++) {
			var chara = this.layer.characters[i];
			if (!chara.died) {
				chara.window.setVisible(true);
				chara.window.setPositionY(y);
				y -= 120;
			}
		}
		
		this.appear();
	},
	
	appear: function() {
		if (this.appearNo == this.appears.length) {
			this.layer.setMode('attack');
			return;
		}
		var chara = this.appears[this.appearNo];
		var y = this.layer.fieldH - this.layer.padding - 50 * this.appearNo;
		chara.setPosition(-100, y);
		chara.setVisible(true);
		chara.nodeGrid.setVisible(true);
		chara.setOpacity(255);
		chara.setDirection(2);
		this.appearNo++;
		chara.runAction(new cc.Sequence(
			new cc.MoveTo(0.5, cc.p(this.layer.padding * 2, y)),
			new cc.CallFunc(this.appear, this)
		));
	}
});
