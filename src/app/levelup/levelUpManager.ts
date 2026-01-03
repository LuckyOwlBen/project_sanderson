import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LevelUpManager {
    // Observable that emits when points availability changes
    private pointsChangedSubject = new BehaviorSubject<void>(undefined);
    public pointsChanged$ = this.pointsChangedSubject.asObservable();

    //ATTRIBUTE POINTS WILL BE 12 AT LEVEL 1 THEN 1 POINT AT LEVELS 3,6,9,12,15,18 TO LEVEL 21
    private ATTRIBUTE_POINTS_PER_LEVEL = [12, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0];
    //SKILL POINTS WILL BE 4 AT LEVEL 1 THEN 2 PER LEVEL AFTER TO LEVEL 21
    private SKILL_POINTS_PER_LEVEL = [4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
    //HEALTH GAINED PER LEVEL WILL BE 10 + STR AT LEVEL 1 THEN +5 TO LEVEL 5, + 4 TO LEVEL 10, +3 TO LEVEL 15, +2 TO LVEL 20 AND 1 AT 21
    private HEALTH_PER_LEVEL = [10, 5, 5, 5, 5, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 1];
    //ADD STRENGTH TO HEALTH GAINED AT THESE LEVELS
    private HEALTH_STRENGTH_BONUS_LEVELS = [1, 6, 11, 16, 21];
    //MAX SKILL RANKS GAIN +2 TO LEVEL 5, +3 TO LEVEL 10, +4 TO LEVEL 15, +5 TO LEVEL 21
    private MAX_SKILL_RANKS_PER_LEVEL = [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5];
    //SKILL RANKS PER LEVEL 5 AT LEVEL 1 THEN 2 TO LEVEL 20
    private SKILL_RANKS_PER_LEVEL = [5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0];
    //2 TALENTS AT LEVEL 1, 6, 11, 16 AND 1 TALENT AT ALL OTHER LEVELS TO 21
    private TALENT_POINTS_PER_LEVEL = [2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1];

    getAttributePointsForLevel(level: number): number {
        return this.ATTRIBUTE_POINTS_PER_LEVEL[level - 1] || 0;
    }

    getTotalAttributePointsUpToLevel(level: number): number {
        let total = 0;
        for (let i = 0; i < level && i < this.ATTRIBUTE_POINTS_PER_LEVEL.length; i++) {
            total += this.ATTRIBUTE_POINTS_PER_LEVEL[i];
        }
        return total;
    }

    getSkillPointsForLevel(level: number): number {
        return this.SKILL_POINTS_PER_LEVEL[level - 1] || 0;
    }

    getTotalSkillPointsUpToLevel(level: number): number {
        let total = 0;
        for (let i = 0; i < level && i < this.SKILL_POINTS_PER_LEVEL.length; i++) {
            total += this.SKILL_POINTS_PER_LEVEL[i];
        }
        return total;
    }

    getHealthForLevel(level: number, strengthModifier: number): number {
        let baseHealth = this.HEALTH_PER_LEVEL[level - 1] || 0;
        if (this.HEALTH_STRENGTH_BONUS_LEVELS.includes(level)) {
            baseHealth += strengthModifier;
        }
        return baseHealth;
    }

    getMaxSkillRanksForLevel(level: number): number {
        return this.MAX_SKILL_RANKS_PER_LEVEL[level - 1] || 0;
    }

    getSkillRanksForLevel(level: number): number {
        return this.SKILL_RANKS_PER_LEVEL[level - 1] || 0;
    }

    getTalentPointsForLevel(level: number): number {
        return this.TALENT_POINTS_PER_LEVEL[level - 1] || 0;
    }

    // Trigger a recalculation event for all listening components
    notifyPointsChanged(): void {
        this.pointsChangedSubject.next();
    }

}
