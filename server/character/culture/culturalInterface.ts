import { Ancestry } from '../ancestry/ancestry';

export interface CulturalInterface {
    name: string;
    description: string;
    suggestedNames: string[];
    expertise: string;
    restrictedToAncestry?: Ancestry;
}