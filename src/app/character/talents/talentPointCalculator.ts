import { Rosharan } from "../ancestry/rosharan";


export class TalentPointCalculator {
    private bonusLevels: number[] = [6, 11, 16, 21];
    private humanBonusLevels: number[] = [1, 6, 11, 16, 21];

    getTalentPointsForLevel(level: number, ancestry: Rosharan): number {
        if (ancestry.constructor.name === 'human') {
            return 1 + (this.humanBonusLevels.includes(level) ? 1 : 0);
        }
        if(ancestry.constructor.name === 'singer') {
            return 1 + (this.bonusLevels.includes(level) ? 1 : 0) + (level >= 10 ? 1 : 0);
        }
        else return 0;
    }

    getSingerTalentPointsForLevel(level: number): number {
        //still looking for more logic on this point
        if(level === 1) {
            return 1;
        }
        else return 0;
    }

}
