/**
 * IdentityModule - MODULE 1: IDENTITY
 * Handles character identification (id, name)
 */

export class IdentityModule {
  id: string = '';
  name: string = '';

  constructor(id: string = '', name: string = '') {
    this.id = id;
    this.name = name;
  }

  /**
   * Set character identity
   */
  setIdentity(id: string, name: string): void {
    this.id = id;
    this.name = name;
  }

  /**
   * Update character name
   */
  setName(name: string): void {
    this.name = name;
  }

  /**
   * Get character ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get character name
   */
  getName(): string {
    return this.name;
  }
}
