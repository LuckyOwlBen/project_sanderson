// Cultural Expertises extracted from culture definitions

export interface ExpertiseDefinition {
    name: string;
    category: 'cultural' | 'armor' | 'utility' | 'weapon' | 'specialist';
    description: string;
}

export const CULTURAL_EXPERTISES: ExpertiseDefinition[] = [
    {
        name: 'Alethi',
        category: 'cultural',
        description: 'You know the names, locations, and highprinces of each princedom. You can replicate regional dialects, find vendors and landmarks. You know spoken Alethi, glyphs, and women\'s script. You\'re familiar with Vorinism, the Almighty, and the Heralds.'
    },
    {
        name: 'Azish',
        category: 'cultural',
        description: 'You know about the bureaucracy, Bronze Palace, Prime Aqasix, and viziers. You can recall basic facts about Azish Empire member states. You know Azish sign language and spoken/written Azish. You can navigate civic buildings and know about the Kadasixes and scions.'
    },
    {
        name: 'Herdazian',
        category: 'cultural',
        description: 'You know of the king and prominent ranching families. You can navigate between expansive ranches and avoid coastal greatshells. You know spoken/written Herdazian and glyphs. You know about ranching tools including sparkflickers and Herdazian Vorinism.'
    },
    {
        name: 'Iriali',
        category: 'cultural',
        description: 'You know of the Iriali Triumvirate. You can find vendors and landmarks in cities or rural areas. You know spoken/written Iri. You\'re familiar with the One and the Long Trail, plus basic travel strategies and journey management.'
    },
    {
        name: 'Kharbranthian',
        category: 'cultural',
        description: 'You\'re familiar with the city\'s major education systems. You know common medicine names, functions, and basic hygiene measures. You know Kharbranthian, glyphs, and women\'s script. You\'re familiar with basic tenets of Vorinism.'
    },
    {
        name: 'Listener',
        category: 'cultural',
        description: 'You\'re aware of dullform, mateform, nimbleform, warform and workform. You\'re familiar with the listener council (the Five). You know the songs and rhythms of Roshar. Generally only available to singer characters or those who lived closely with listeners.'
    },
    {
        name: 'Natan',
        category: 'cultural',
        description: 'You\'ve heard tales of lost Natan lands. You know what highstorms are like at full potency and defensive measures. You know Natan or another Vorin language. You\'re familiar with Vorinism and Natan reverence for the moons.'
    },
    {
        name: 'Reshi',
        category: 'cultural',
        description: 'You know about Tai-na greatshells, spren deities, and tales of island wars. You\'re familiar with Reshi Sea ecology and major stationary islands. You know spoken/written Reshi. You know which resources are unavailable in the Reshi Isles and their sources.'
    },
    {
        name: 'Shin',
        category: 'cultural',
        description: 'You\'re familiar with mild highstorms in Shinovar and their supported ecology/architecture. You know how to barter by diminishing perceived value. You know spoken/written Shin. You\'re familiar with Stone Shamanism.'
    },
    {
        name: 'Thaylen',
        category: 'cultural',
        description: 'You\'re familiar with the elective monarchy and merchant councils. You know major artifabrian guilds and experienced fabrials in everyday life. You know tips to mitigate sea sickness and arrange travel. You know spoken/written Thaylen and Vorinism.'
    },
    {
        name: 'Unkalaki',
        category: 'cultural',
        description: 'You know about leadership, ecology, and myths of the oceans atop the peaks. Your body is familiar with breathing thin air. You know spoken/written Unkalaki. You know of gods of waters, mountains, trees, and worshiping spren as gods.'
    },
    {
        name: 'Veden',
        category: 'cultural',
        description: 'You\'re familiar with the king, princedoms, and four major ethnic groups in Jah Keved. You know spoken Veden, glyphs, and women\'s script. You may also know Alethi, Bav, or Siln languages. You\'re familiar with Vorinism.'
    },
    {
        name: 'Wayfarer',
        category: 'cultural',
        description: 'You know how to read international map keys. You can find trustworthy currency exchange hubs in major cities. From your travels, you\'ve learned basic greetings and cultural touchstones from various nations.'
    }
];

export const ITEM_EXPERTISES: ExpertiseDefinition[] = [
    {
        name: 'Animal Care',
        category: 'utility',
        description: 'Knowledge in caring for and managing animals, including feeding, grooming, and basic medical care.'
    },
    {
        name: 'Breastplate',
        category: 'armor',
        description: 'Specialized proficiency with breastplates and similar torso armor. Granted by talents like Iron Will.'
    },
    {
        name: 'Culinary Arts', 
        category: 'utility',
        description: 'Knowledge in preparing, cooking, and presenting food. Includes understanding of ingredients, techniques, and kitchen safety.'
    },
    {
        name: 'Engineering',
        category: 'utility',
        description: 'Knowledge in designing, building, and maintaining mechanical systems and devices.'
    },
    {
        name: 'High Socicety',
        category: 'utility',
        description: 'Knowledge in navigating social hierarchies, etiquette, and influential networks.'
    },
    {
        name: 'History',
        category: 'utility',
        description: 'Knowledge in historical events, cultures, and significant figures.'
    },
    {
        name: 'Improvised Weapons',
        category: 'weapon',
        description: 'Specialized proficiency with improvised weapons. Granted by talents like Improvised Combat.'
    },
    {
        name: 'Knives',
        category: 'weapon',
        description: 'Specialized proficiency with knives and similar bladed tools. Granted by talents like Killing Edge.'
    },
    {
        name: 'Leather Armor',
        category: 'armor',
        description: 'Specialized proficiency with leather armor. Granted by talents like Leather Mastery.'
    },
    {
        name: 'Military Strategy',
        category: 'utility',
        description: 'Knowledge in planning and executing military operations, including tactics, logistics, and leadership.'
    },
    {
        name: 'Religion',
        category: 'utility',
        description: 'Knowledge in various religious beliefs, practices, and institutions.'
    },
    {
        name: 'Riding Horses',
        category: 'utility',
        description: 'Knowledge in riding and managing horses, including basic care and training.'
    },
    {
        name: 'Shortbow',
        category: 'weapon',
        description: 'Specialized proficiency with shortbows and similar ranged weapons. Granted by talents like Archery Mastery.'
    },
    {
        name: 'Shortspear',
        category: 'weapon',
        description: 'Specialized proficiency with shortspears and similar polearms. Granted by talents like Polearm Mastery.'
    },
    {
        name: 'Sidesword',
        category: 'weapon',
        description: 'Specialized proficiency with sideswords and similar one-handed swords. Granted by talents like Sword Mastery.'
    },
    {
        name: 'Unarmed Attacks',
        category: 'weapon',
        description: 'Specialized proficiency with unarmed combat techniques. Granted by talents like Martial Arts Mastery.'
    },
    {
        name: 'Underworld',
        category: 'utility',
        description: 'Knowledge in navigating and understanding the criminal underworld, including its networks, operations, and key figures.'
    },
    {
        name: 'Visual Arts',
        category: 'utility',
        description: 'Knowledge in visual arts, including painting, drawing, sculpture, and other forms of artistic expression.'
    },
    {
        name: 'Fabrial Operation',
        category: 'utility',
        description: 'Knowledge in operating and repairing common fabrials used for everyday tasks and combat support.'
    },
];

export const CRAFTING_EXPERTISES: ExpertiseDefinition[] = [
    {
        name: 'Armor Crafting',
        category: 'specialist',
        description: 'Skilled in crafting and repairing various types of armor.'
    },
    {
        name: 'Weapon Crafting',
        category: 'specialist',
        description: 'Skilled in crafting and maintaining different kinds of weapons.'
    },
    {
        name: 'Fabrial Crafting',
        category: 'specialist',
        description: 'Expertise in creating and enchanting fabrials for various uses.'
    },
    {
        name: 'Equipment Crafting',
        category: 'specialist',
        description: 'Skilled in crafting and maintaining various types of equipment.'
    },
];
export const ALL_EXPERTISES: ExpertiseDefinition[] = [
    ... CULTURAL_EXPERTISES,
    ... ITEM_EXPERTISES,
    ... CRAFTING_EXPERTISES,
];
