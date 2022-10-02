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
	      "1": '<img src="systems/shiver/assets/dice/skill/SHIVER_GRIT.png" />',
        "2": '<img src="systems/shiver/assets/dice/skill/SHIVER_WIT.png" />',
        "3": '<img src="systems/shiver/assets/dice/skill/SHIVER_SMARTS.png" />',
        "4": '<img src="systems/shiver/assets/dice/skill/SHIVER_HEART.png" />',
	      "5": '<img src="systems/shiver/assets/dice/skill/SHIVER_STRANGE.png" />',
        "6": '<img src="systems/shiver/assets/dice/skill/SHIVER_LUCK.png" />'
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
      "1": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_STRANGE2.png" />',
      "2": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_STRANGE.png" />',
      "3": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_STRANGE.png" />',
      "4": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_TALENT.png" />',
      "5": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_TALENT.png" />',
      "6": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_TALENT.png" />',
      "7": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_TALENT2.png" />',
      "8": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_TALENT2.png" />'
      }[result.result];
  }
}
  