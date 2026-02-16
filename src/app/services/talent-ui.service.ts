import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getTalentTree, getTalentPath } from '../../../shared/data/talents/talentTrees';
import { TalentTree, TalentPath, RadiantPathData } from '../../../shared/types/talents';

@Injectable({ providedIn: 'root' })
export class TalentUIService {
  private apiBase =
    window.location.hostname === 'localhost' && window.location.port === '4200'
      ? 'http://localhost:3000/api'
      : '/api';

  constructor(private http: HttpClient) {}

  /**
   * Load TalentTree objects for a list of tree IDs
   * Simple registry lookup - safe to call on frontend
   */
  loadTreesForIds(treeIds: string[]): TalentTree[] {
    return treeIds
      .map((treeId) => getTalentTree(treeId.toLowerCase()))
      .filter((tree): tree is TalentTree => tree !== undefined);
  }

  /**
   * Add radiant surge trees if character has spoken first ideal
   * Reads surgePair from radiantPath and loads those surge trees
   */
  addRadiantTrees(trees: TalentTree[], radiantPath: RadiantPathData | undefined): TalentTree[] {
    if (!radiantPath?.idealSpoken || !radiantPath?.surgePair) {
      return trees;
    }

    // surgePair is stored with "/" separators like "DIVISION/ABRASION"
    const surgePairs = radiantPath.surgePair.split('/').filter((s) => s.trim());
    const existingTreeNames = new Set(trees.map((t) => t.pathName.toLowerCase()));

    const surgeTrees = surgePairs
      .map((surgeName) => getTalentTree(surgeName.toLowerCase().trim()))
      .filter((tree): tree is TalentTree => {
        return tree !== undefined && !existingTreeNames.has(tree.pathName.toLowerCase());
      });

    return [...trees, ...surgeTrees];
  }

  /**
   * Find the parent core path for a specialization tree
   * Uses local registry - no HTTP call needed
   * e.g., findParentPath('diplomat') => 'envoy'
   * e.g., findParentPath('duelist') => 'warrior'
   */
  findParentPath(treeId: string): string | null {
    const allPaths = ['warrior', 'scholar', 'hunter', 'leader', 'envoy', 'agent'];
    const normalizedTreeId = treeId.toLowerCase();

    for (const pathId of allPaths) {
      const talentPath = getTalentPath(pathId);
      if (talentPath?.paths?.some((tree) => tree.pathName.toLowerCase() === normalizedTreeId)) {
        return pathId;
      }
    }

    return null;
  }

  /**
   * Get available bonus class core paths
   * Returns all 6 core paths except main and specialty
   * e.g., getAvailableBonusClasses('warrior', 'scholar') => ['hunter', 'leader', 'envoy', 'agent']
   */
  getAvailableBonusClasses(mainPath: string | null, specialty: string | null): string[] {
    const allCorePaths = ['warrior', 'scholar', 'hunter', 'leader', 'envoy', 'agent'];
    const normalizedMain = mainPath?.toLowerCase() || null;
    const normalizedSpecialty = specialty?.toLowerCase() || null;

    return allCorePaths.filter((path) => path !== normalizedMain && path !== normalizedSpecialty);
  }

  /**
   * Get specialization sub-trees for a core path
   * e.g., getSpecializationsForPath('warrior') => ['duelist', 'shardbearer', 'soldier']
   */
  getSpecializationsForPath(pathId: string): TalentTree[] {
    const talentPath = getTalentPath(pathId.toLowerCase());
    if (!talentPath?.paths) return [];
    return talentPath.paths;
  }

  /**
   * Determine the default selected tree based on ancestry
   * Singer trees should be selected first for singers
   */
  getDefaultSelectedTree(trees: TalentTree[], ancestry: string | null): TalentTree | null {
    if (trees.length === 0) return null;

    // For singers, prefer the Singer tree
    if (ancestry?.toLowerCase() === 'singer') {
      const singerTree = trees.find((tree) => tree.pathName.toLowerCase().includes('singer'));
      if (singerTree) return singerTree;
    }

    // Otherwise return first available
    return trees[0];
  }

  /**
   * Call backend to find parent path (alternative to local lookup)
   * Useful if you want to validate against backend registry
   */
  findParentPathViaAPI(treeId: string): Observable<{ treeId: string; parent: string | null }> {
    return this.http
      .get<{ success: boolean; data: { treeId: string; parent: string | null } }>(
        `${this.apiBase}/talents/parent/${treeId}`
      )
      .pipe(
        (source) =>
          new Observable((subscriber) => {
            source.subscribe({
              next: (response) => subscriber.next(response.data),
              error: (error) => subscriber.error(error),
              complete: () => subscriber.complete(),
            });
          })
      );
  }

  /**
   * Call backend to get available bonus classes
   * Useful if you want to validate against backend rules
   */
  getAvailableBonusClassesViaAPI(
    mainPath: string | null,
    specialty: string | null
  ): Observable<{ mainPath: string | null; specialty: string | null; available: string[] }> {
    const params = new URLSearchParams();
    if (mainPath) params.set('mainPath', mainPath);
    if (specialty) params.set('specialty', specialty);

    return this.http
      .get<{
        success: boolean;
        data: { mainPath: string | null; specialty: string | null; available: string[] };
      }>(`${this.apiBase}/talents/bonus-classes?${params.toString()}`)
      .pipe(
        (source) =>
          new Observable((subscriber) => {
            source.subscribe({
              next: (response) => subscriber.next(response.data),
              error: (error) => subscriber.error(error),
              complete: () => subscriber.complete(),
            });
          })
      );
  }
}
