import { CulturalInterface } from './culturalInterface';
import { ALETHI_CULTURE } from './alethi';
import { AZISH_CULTURE } from './azish';
import { HERDAZIAN_CULTURE } from './herdazian';
import { IRIALI_CULTURE } from './iriali';
import { KHARBRANTHIAN_CULTURE } from './kharbranthian';
import { LISTENER_CULTURE } from './listener';
import { NATAN_CULTURE } from './natan';
import { RESHI_CULTURE } from './reshi';
import { SHIN_CULTURE } from './shin';
import { THAYLEN_CULTURE } from './thaylen';
import { UNKALAKI_CULTURE } from './unkalaki';
import { VEDEN_CULTURE } from './veden';
import { WAYFARER_CULTURE } from './wayfarer';

export const ALL_CULTURES: CulturalInterface[] = [
    ALETHI_CULTURE,
    AZISH_CULTURE,
    HERDAZIAN_CULTURE,
    IRIALI_CULTURE,
    KHARBRANTHIAN_CULTURE,
    LISTENER_CULTURE,
    NATAN_CULTURE,
    RESHI_CULTURE,
    SHIN_CULTURE,
    THAYLEN_CULTURE,
    UNKALAKI_CULTURE,
    VEDEN_CULTURE,
    WAYFARER_CULTURE
];

export const CULTURE_BY_NAME: Record<string, CulturalInterface> = {
    'Alethi': ALETHI_CULTURE,
    'Azish': AZISH_CULTURE,
    'Herdazian': HERDAZIAN_CULTURE,
    'Iriali': IRIALI_CULTURE,
    'Kharbranthian': KHARBRANTHIAN_CULTURE,
    'Listener': LISTENER_CULTURE,
    'Natan': NATAN_CULTURE,
    'Reshi': RESHI_CULTURE,
    'Shin': SHIN_CULTURE,
    'Thaylen': THAYLEN_CULTURE,
    'Unkalaki': UNKALAKI_CULTURE,
    'Veden': VEDEN_CULTURE,
    'Wayfarer': WAYFARER_CULTURE
};
