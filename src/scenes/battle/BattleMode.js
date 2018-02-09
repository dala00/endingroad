var BattleMode = {
	extend: function(data) {
		function f(layer) {
			this.layer = layer;
		}
		f.prototype = {
			initialize: function() {

			},

			update: function(dt) {

			},

			onClick: function(pos) {

			}
		};
		for (var i in data) {
			f.prototype[i] = data[i];
		}
		return f;
	}	
};
