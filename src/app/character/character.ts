import { Attributes } from './attributes/attributes';
import { SkillManager } from './skills/skillManager';
import { DerivedAttributesManager } from './attributes/derivedAttributes/derivedAttributesManager';
import { DefenseManager } from './defenses/defenseManager';
import { ResourceManager } from './resources/resourceManager';
import { BonusManager } from './bonuses/bonusManager';
import { Ancestry } from './ancestry/ancestry';
import { CulturalInterface } from './culture/culturalInterface';
import { RadiantPathManager } from './radiantPath/radiantPathManager';


export class Character {

  name: string = '';
  level: number = 1;
  paths: string[] = [];
  ancestry: Ancestry | null = null;
  attributes: Attributes;
  cultures: CulturalInterface[] = [];
  unlockedTalents: Set<string> = new Set<string>();

  private skillManager = new SkillManager();
  private derivedAttributesManager = new DerivedAttributesManager();
  private defenseManager = new DefenseManager();
  private resourceManager: ResourceManager;
  private bonusManager = new BonusManager();
  private radiantPathManager = new RadiantPathManager();

  constructor() {
    this.attributes = new Attributes();
    this.resourceManager = new ResourceManager(this.attributes);
    this.bonusManager.setCharacter(this);
  }

  get skills(): SkillManager {
    return this.skillManager;
  }

  get derivedAttributes(): DerivedAttributesManager {
    return this.derivedAttributesManager;
  }

  get defenses(): DefenseManager {
    return this.defenseManager;
  }

  get resources(): ResourceManager {
    return this.resourceManager;
  }

  get bonuses(): BonusManager {
    return this.bonusManager;
  }

  get radiantPath(): RadiantPathManager {
    return this.radiantPathManager;
  }

}
