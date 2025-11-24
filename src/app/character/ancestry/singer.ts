import { Rosharan } from "./rosharan";

export class Singer extends Rosharan {
    singerTalentPoints: number;

    constructor() {
        super();
        this.singerTalentPoints = 0;
    }
}