import { Component } from '@angular/core';
import { SkillManager } from '../skill-manager/skill-manager';

/**
 * SkillSelector - wrapper component for SkillManager
 * This component delegates to SkillManager for actual skill allocation functionality.
 * Kept for backward compatibility or as a named alternative entry point.
 */
@Component({
  selector: 'app-skill-selector',
  imports: [SkillManager],
  templateUrl: './skill-selector.html',
  styleUrl: './skill-selector.scss',
})
export class SkillSelector {

}
