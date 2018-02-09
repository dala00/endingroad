var g_resources = [
    'ui/Loading/Loading.json',
	"ui/TitleUi_1/TitleUi_1.json",

    'sounds/decide11.wav',
    'sounds/se04.wav',
    'sounds/bigshot1.wav',
    'sounds/status1.wav',
    'sounds/cursor8.wav',
    'sounds/soft-c02.mp3',

    "font2.fnt",
    "attributes/sticon1b-3.png",
    "attributes/sticon1c-3.png",
    "attributes/sticon1d-3.png",
    "attributes/sticon1e-3.png",
    "attributes/sticon1j-3.png",

    "ui/StageUi/StageUi.json",
    "ui/StageParty/StageParty.json",
    "ui/StagePartyCell/StagePartyCell.json",
    "ui/StageButton/StageButton.json",
    "ui/BattleLabel/BattleLabel.json",
    'ui/BattleWindow/BattleWindow.json',
    'ui/Navi/Navi.json',
    'ui/Party/Party.json',
    'ui/PartySelect/PartySelect.json',
    'ui/GachaResult/GachaResult.json',
    'ui/BattleResultRow/BattleResultRow.json',
    'ui/Character/Character.json',
    'ui/CharacterSkill/CharacterSkill.json',
    'ui/Header/Header.json',
    'ui/MessageBox/MessageBox.json',
    'ui/Gacha/Gacha.json',
    'ui/Shop/Shop.json',
    'ui/Event/Event.json',
    'ui/Event10001/Event10001.json',
    'ui/Event10002/Event10002.json',
    'ui/Event10003/Event10003.json',
    'ui/Event10004/Event10004.json',
    'ui/Event10005/Event10005.json',
    'ui/Credit/Credit.json',
    'ui/Help/Help.json',
    'ui/Battle/Battle.json',
    'ui/GachaRatio/GachaRatio.json',
    'ui/Message/Message.json',
    'ui/Maintenance/Maintenance.json',
    'ui/Config/Config.json',
    'ui/Invite/Invite.json',

    'particles/battle_teropbg.plist',
    'particles/skill_bg.plist',
    'particles/heal.plist',
    'particles/fire.plist',
    'particles/gacha_result.plist',
    'particles/limit.plist',
    'particles/snow.plist',
    'particles/light_fly.plist',
    'particles/dark_attack.plist',
    'particles/dark_attack_all.plist',

    'pipo-CursorBase001.png',
    'pipo-CursorBase002.png',
    'pipo-WindowBase001.png',
    'pipo-Text_Pause001.png',

    'icons/icon002.png',
    'icons/icon010.png',
    'icons/pipo-emotion.png'
];

if (cc.sys.os == 'Windows' || cc.sys.os == 'OS X') {
	if (cc.sys.browserType == 'ie') {
		var g_sounds = [
            'sounds/tamhe07.mp3',
            'sounds/Galaxy_loop.mp3',
            'sounds/Fairwind_loop.mp3',
            'sounds/tamhe08_loop.mp3'
        ];
	} else {
		var g_sounds = [
            'sounds/tamhe07.mp3',
            'sounds/Galaxy_loop.ogg',
            'sounds/Fairwind_loop.ogg',
            'sounds/tamhe08_loop.ogg'
        ];
	}
	g_resources = g_sounds.concat(g_resources);
}
