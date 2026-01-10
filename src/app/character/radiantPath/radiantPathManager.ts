import { SkillType } from "../skills/skillTypes";
import { SkillManager } from "../skills/skillManager";
import { UniversalAbility, getAvailableAbilities } from "../abilities/universalAbilities";

export interface RadiantOrderInfo {
    order: string;
    sprenType: string;
    surgePair: [SkillType, SkillType];
    philosophy: string;
}

export const RADIANT_ORDERS: Record<string, RadiantOrderInfo> = {
    'Windrunner': {
        order: 'Windrunner',
        sprenType: 'Honorspren',
        surgePair: [SkillType.ADHESION, SkillType.GRAVITATION],
        philosophy: 'Protect the innocent and the defenseless.'
    },
    'Skybreaker': {
        order: 'Skybreaker',
        sprenType: 'Highspren',
        surgePair: [SkillType.DIVISION, SkillType.GRAVITATION],
        philosophy: 'Enforce the law and strive for justice.'
    },
    'Dustbringer': {
        order: 'Dustbringer',
        sprenType: 'Ashspren',
        surgePair: [SkillType.DIVISION, SkillType.ABRASION],
        philosophy: 'Great power requires strong discipline.'
    },
    'Edgedancer': {
        order: 'Edgedancer',
        sprenType: 'Cultivationspren',
        surgePair: [SkillType.ABRASION, SkillType.PROGRESSION],
        philosophy: 'Remember and serve those who others forget.'
    },
    'Truthwatcher': {
        order: 'Truthwatcher',
        sprenType: 'Mistspren',
        surgePair: [SkillType.ILLUMINATION, SkillType.PROGRESSION],
        philosophy: 'Search for fundamental truth and share it.'
    },
    'Lightweaver': {
        order: 'Lightweaver',
        sprenType: 'Cryptic',
        surgePair: [SkillType.ILLUMINATION, SkillType.TRANSFORMATION],
        philosophy: 'Separate truth from lies.'
    },
    'Elsecaller': {
        order: 'Elsecaller',
        sprenType: 'Inkspren',
        surgePair: [SkillType.TRANSFORMATION, SkillType.TRANSPORTATION],
        philosophy: 'Strive to reach your true potential.'
    },
    'Willshaper': {
        order: 'Willshaper',
        sprenType: 'Lightspren',
        surgePair: [SkillType.COHESION, SkillType.TRANSPORTATION],
        philosophy: 'Seek freedom and choice for all peoples.'
    },
    'Stoneward': {
        order: 'Stoneward',
        sprenType: 'Peakspren',
        surgePair: [SkillType.COHESION, SkillType.TENSION],
        philosophy: 'Be the support on which others can depend.'
    },
    'Bondsmith': {
        order: 'Bondsmith',
        sprenType: 'Unique spren',
        surgePair: [SkillType.ADHESION, SkillType.TENSION],
        philosophy: 'Unite before you divide, and strive for peace before engaging in war.'
    }
};

export class RadiantPathManager {
    private boundOrder: string | null = null;
    private idealSpoken: boolean = false;
    private surgePair: [SkillType, SkillType] | null = null;
    private sprenType: string | null = null;

    constructor() {}

    /**
     * Grant a spren bond to the character, unlocking the Radiant Order's tier 0 talent
     */
    grantSpren(order: string): void {
        if (!RADIANT_ORDERS[order]) {
            throw new Error(`Invalid Radiant Order: ${order}`);
        }

        const orderInfo = RADIANT_ORDERS[order];
        this.boundOrder = order;
        this.sprenType = orderInfo.sprenType;
        this.surgePair = orderInfo.surgePair;
        this.idealSpoken = false;
    }

    /**
     * Speak the First Ideal, unlocking surge skills and surge talent trees
     */
    speakIdeal(skillManager: SkillManager): void {
        if (!this.boundOrder || !this.surgePair) {
            throw new Error('Cannot speak ideal without a bound spren');
        }

        if (this.idealSpoken) {
            console.warn('First Ideal already spoken');
            return;
        }

        // Add the two surge skills at rank 1
        const [surge1, surge2] = this.surgePair;
        skillManager.setSkillRank(surge1, 1);
        skillManager.setSkillRank(surge2, 1);

        this.idealSpoken = true;
    }

    /**
     * Get the surge tree IDs for loading talent trees
     */
    getSurgeTrees(): string[] {
        if (!this.idealSpoken || !this.surgePair) {
            return [];
        }

        // Return surge names in lowercase for tree IDs
        return this.surgePair.map(surge => surge.toLowerCase());
    }

    /**
     * Get the Radiant Order tree ID
     */
    getOrderTree(): string | null {
        if (!this.boundOrder) {
            return null;
        }
        return this.boundOrder.toLowerCase();
    }

    /**
     * Check if character has a bound spren
     */
    hasSpren(): boolean {
        return this.boundOrder !== null;
    }

    /**
     * Check if character has spoken the First Ideal
     */
    hasSpokenIdeal(): boolean {
        return this.idealSpoken;
    }

    /**
     * Get the current order info
     */
    getOrderInfo(): RadiantOrderInfo | null {
        if (!this.boundOrder) {
            return null;
        }
        return RADIANT_ORDERS[this.boundOrder];
    }

    /**
     * Get universal abilities available to this Radiant
     * Returns all Radiant universal abilities if the First Ideal has been spoken
     */
    getUniversalAbilities(): UniversalAbility[] {
        return getAvailableAbilities(this.idealSpoken);
    }

    /**
     * Serialize for character storage
     */
    toJSON(): any {
        return {
            boundOrder: this.boundOrder,
            idealSpoken: this.idealSpoken,
            surgePair: this.surgePair,
            sprenType: this.sprenType
        };
    }

    /**
     * Deserialize from character storage
     */
    fromJSON(data: any): void {
        this.boundOrder = data.boundOrder || null;
        this.idealSpoken = data.idealSpoken || false;
        this.surgePair = data.surgePair || null;
        this.sprenType = data.sprenType || null;
    }

    /**
     * Reset all radiant path data
     */
    reset(): void {
        this.boundOrder = null;
        this.idealSpoken = false;
        this.surgePair = null;
        this.sprenType = null;
    }
}
