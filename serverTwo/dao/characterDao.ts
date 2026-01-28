export class CharacterData {

    id: string;
    name: string;
    level: number;
    pendingLevelPoints: number;
    ancestry: string | null;
    sessionNotes: string;
    lastModified: string;
    cultures?: any[];
    paths?: string[];
    attributes?: Record<string, number>;
    skills?: Record<string, number>;
    unlockedTalents?: string[];
    selectedExpertises?: any[];
    inventory?: any[];
    resources?: {
        health: { current: number; max: number };
        focus: { current: number; max: number };
        investiture: { current: number; max: number; isActive: boolean };
    };

     constructor() {
        this.id = '';
        this.name = '';
        this.level = 1;
        this.pendingLevelPoints = 0;
        this.ancestry = null;
        this.sessionNotes = '';
        this.lastModified = new Date().toISOString();
    }
}