export class ShiverSkillDie extends Die {
    constructor(termData) {
      super(termData);
      this.faces = 6;
    }

    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = "6";

    /* -------------------------------------------- */

    /** @override */
    getResultLabel(result) {
        return {
	      "1": '<img src="systems/shiver/assets/dice/skill/SHIVER_GRIT_small.png" width="30" height="30" />',
        "2": '<img src="systems/shiver/assets/dice/skill/SHIVER_WIT_small.png" width="30" height="30"/>',
        "3": '<img src="systems/shiver/assets/dice/skill/SHIVER_SMARTS_small.png" width="30" height="30"/>',
        "4": '<img src="systems/shiver/assets/dice/skill/SHIVER_HEART_small.png" width="30" height="30"/>',
	      "5": '<img src="systems/shiver/assets/dice/skill/SHIVER_STRANGE_small.png" width="30" height="30"/>',
        "6": '<img src="systems/shiver/assets/dice/skill/SHIVER_LUCK_small.png" width="30" height="30"/>'
        }[result.result];
    }
}

export class ShiverTalentDie extends Die {
  constructor(termData) {
    super(termData);
    this.faces = 8;
  }

  /* -------------------------------------------- */

  /** @override */
  static DENOMINATION = "8";

  /* -------------------------------------------- */

  /** @override */
  getResultLabel(result) {
      return {
      "1": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_STRANGE2_small.png" width="32" height="32" />',
      "2": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_STRANGE_small.png" width="32" height="32"/>',
      "3": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_STRANGE_small.png" width="32" height="32"/>',
      "4": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_TALENT_small.png" width="32" height="32"/>',
      "5": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_TALENT_small.png" width="32" height="32"/>',
      "6": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_TALENT_small.png" width="32" height="32"/>',
      "7": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_TALENT2_small.png" width="32" height="32"/>',
      "8": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_TALENT2_small.png" width="32" height="32"/>'
      }[result.result];
  }
}
  