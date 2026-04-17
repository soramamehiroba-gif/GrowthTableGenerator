/**
 * GrowthTableGenerator.js<br>
 * <br>
 *   ・ゲーム開始時に全キャラの成長結果を予め決めて固定します<br>
 *   ・簡単なピン数保証（最低成長値）付き<br>
 */

// -----------------------------------------
// 設定項目
// -----------------------------------------

// ★ピン数保証
var MIN_GROWTH_SUM = 2;

// ★リトライ上限
var MAX_GROWTH_ROLLS = 20;

// -----------------------------------------
// 以下プログラム
// -----------------------------------------

(function() {

    // -----------------------------------------
    // NewGame 時に全味方ユニットの成長テーブルを生成
    // -----------------------------------------
    var _TitleCommand__NewGame___doEndAction = TitleCommand.NewGame._doEndAction;
    TitleCommand.NewGame._doEndAction = function() {
        var global = root.getMetaSession().global;
        global.growthTableList = {};

        var list = root.getBaseData().getPlayerList();
        var count = list.getCount();

        for (var i = 0; i < count; i++) {
            var unit = list.getData(i);
            generateGrowthTable(unit);
        }

        return _TitleCommand__NewGame___doEndAction.call(this);
    };

    // -----------------------------------------
    // LvUP 時はテーブルを参照
    // -----------------------------------------
     var _ExperienceControl__createGrowthArray = ExperienceControl._createGrowthArray;

    ExperienceControl._createGrowthArray = function(unit) {

        var global = root.getMetaSession().global;
        var list = global.growthTableList;

        if (list) {
            var table = list[unit.getId()];
            if (table) {
                var nextLv = unit.getLv();
                var growth = table[nextLv];

                if (growth) {
                    return growth;
                }
            }
        }

        return _ExperienceControl__createGrowthArray.call(this, unit);
    };

})();

// -----------------------------------------
// 成長テーブル生成
// -----------------------------------------
function generateGrowthTable(unit) {
    var maxLv = Miscellaneous.getMaxLv(unit);
    var table = {};

    for (var lv = unit.getLv() + 1; lv <= maxLv; lv++) {
        table[lv] = createRandomGrowth(unit);
    }

    var global = root.getMetaSession().global;

    global.growthTableList[unit.getId()] = table;
}

// -----------------------------------------
// 乱数で成長値を生成（例：成長率方式を利用）
// -----------------------------------------
function createRandomGrowth(unit) {
    var arr = [];
    var retry = 0;
    var growthTotal = 0;
    var count = ParamGroup.getParameterCount();
    var weapon = ItemControl.getEquippedWeapon(unit);

    while (true) {
        arr = [];
        growthTotal = 0;

        for (var i = 0; i < count; i++) {
            var growthRate = ParamGroup.getGrowthBonus(unit, i) + ParamGroup.getUnitTotalGrowthBonus(unit, i, weapon);
            var value = ExperienceControl._getGrowthValue(growthRate);
            growthTotal += value;
            arr.push(value);
        }

        // ★条件達成 → 採用
        if (growthTotal >= MIN_GROWTH_SUM) {
            break;
        }

        // ★リトライ上限 → 強制採用
        retry++;
        if (retry >= MAX_GROWTH_ROLLS) {
            break;
        }
    }

    return arr;
}