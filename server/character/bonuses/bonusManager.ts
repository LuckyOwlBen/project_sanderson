import { AdvantageModule } from '../advantage/AdvantageModule';
import { Character } from '../character';
import { TalentNode } from '../talents/talentInterface';
import { TalentPrerequisiteChecker } from '../talents/talentPrerequesite';
import { BonusModule } from './bonusModule';

export class BonusManager {
  private bonusModule = new BonusModule();
  private advantageModule = new AdvantageModule();
  private unlockedTalents: Set<string> = new Set();
  private activeForm?: string; //track current Singer form
  private prerequisiteChecker?: TalentPrerequisiteChecker;
  private character?: Character; // Reference to character for expertise grants

  setCharacter(character: Character): void {
    this.character = character;
    this.prerequisiteChecker = new TalentPrerequisiteChecker(character, this.unlockedTalents);
  }

  get bonuses(): BonusModule {
    return this.bonusModule;
  }

  get advantages(): AdvantageModule {
    return this.advantageModule;
  }

  unlockTalent(talentId: string, talentNode: TalentNode): boolean {
    if (this.prerequisiteChecker?.canUnlockTalent(talentNode)) {
      return false; // Talent already unlocked
    }

    this.unlockedTalents.add(talentId);

    //Apply numeric bonuses
    talentNode.bonuses.forEach(bonus => {
      this.bonusModule.addBonus(`talent:${talentId}`, bonus);
    });

    // Apply advantages
    talentNode.grantsAdvantage?.forEach(situation => {
      this.advantageModule.addAdvantage(`talent:${talentId}:${situation}`);
    });

    // Apply disadvantages
    talentNode.grantsDisadvantage?.forEach(situation => {
      this.advantageModule.addDisadvantage(`talent:${talentId}:${situation}`);
    });

    return true;
  }

  activateForm(formId: string, talentNode: TalentNode): void {
    // Deactivate previous form bonuses
    if (this.activeForm) {
      this.bonusModule.removeBonus(`form:${this.activeForm}`);
      // Remove all advantages from old form
      talentNode.grantsAdvantage?.forEach(situation => {
        this.advantageModule.removeAdvantage(`form:${this.activeForm}:${situation}`);
      });
      // Remove all disadvantages from old form
      talentNode.grantsDisadvantage?.forEach(situation => {
        this.advantageModule.removeDisadvantage(`form:${this.activeForm}:${situation}`);
      });
    }
    // Activate new form bonuses
    this.activeForm = formId;
    talentNode.bonuses.forEach(bonus => {
      this.bonusModule.addBonus(`form:${formId}`, bonus);
    });

    // Activate new form advantages
    talentNode.grantsAdvantage?.forEach(situation => {
      this.advantageModule.addAdvantage(`form:${formId}:${situation}`);
    });

    // Activate new form disadvantages
    talentNode.grantsDisadvantage?.forEach(situation => {
      this.advantageModule.addDisadvantage(`form:${formId}:${situation}`);
    });
  }

  /**
   * Grant expertise from a talent
   * This is called manually when a talent grants expertises
   */
  grantExpertise(talentId: string, expertiseName: string): void {
    if (!this.character) {
      console.warn('Cannot grant expertise: character not set');
      return;
    }

    // Add expertise with talent source
    const existing = this.character.selectedExpertises.find(e => e.name === expertiseName);
    if (!existing) {
      this.character.selectedExpertises.push({
        name: expertiseName,
        source: 'talent',
        sourceId: `talent:${talentId}`
      });
    }
  }

  /**
   * Remove all expertises granted by a specific talent
   * Called when a talent is removed
   */
  removeExpertisesByTalent(talentId: string): void {
    if (!this.character) {
      return;
    }

    const sourceId = `talent:${talentId}`;
    this.character.selectedExpertises = this.character.selectedExpertises.filter(
      e => e.sourceId !== sourceId
    );
  }
}
