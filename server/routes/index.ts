/**
 * Route Registration Module
 * 
 * Centralizes route imports and registration.
 * Makes it easy to add new domain routes as they're created.
 * 
 * Current routes:
 * - Talent system (talents, paths)
 * - Future: Attributes, Skills, Inventory, Resources, etc.
 */

import express, { Router } from 'express';
import TalentService from '../services/talent-service.js';
import createTalentRoutes from './talents.js';
import createPathRoutes from './paths.js';

export function registerRoutes(app: express.Application): void {
  // Initialize service instances
  const talentService = new TalentService();

  // Create routers with dependency injection
  const talentRouter = createTalentRoutes(talentService);
  const pathRouter = createPathRoutes(talentService);

  // Register routers
  app.use('/api', talentRouter);
  app.use('/api', pathRouter);

  console.log('[Routes] Registered: talents, paths');
}

export default registerRoutes;
