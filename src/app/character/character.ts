import { Attributes } from './attributes/attributes';
import { SkillManager } from './skills/skillManager';
import { DerivedAttributesManager } from './attributes/derivedAttributes/derivedAttributesManager';
import { DefenseManager } from './defenses/defenseManager';
import { ResourceManager } from './resources/resourceManager';


export class Character {

  name: string = '';
  level: number = 1;
  paths: string[] = [];
  ancestry: string = '';
  attributes: Attributes;

  private skillManager = new SkillManager();
  private derivedAttributesManager = new DerivedAttributesManager();
  private defenseManager = new DefenseManager();
  private resourceManager: ResourceManager;
  

  constructor() {
    this.attributes = new Attributes();
    this.resourceManager = new ResourceManager(this.attributes);
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

}