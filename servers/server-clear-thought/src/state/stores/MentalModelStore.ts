/**
 * Store for managing mental model application data
 */

import { BaseStore } from './BaseStore.js';
import { MentalModelData } from '../../types/index.js';

/**
 * Specialized store for managing mental model applications
 */
export class MentalModelStore extends BaseStore<MentalModelData> {
  /** Map of model names to their applications */
  private modelApplications: Map<string, MentalModelData[]>;
  
  constructor() {
    super('MentalModelStore');
    this.modelApplications = new Map();
  }
  
  /**
   * Add a new mental model application
   * @param id - Unique identifier
   * @param model - The mental model data
   */
  add(id: string, model: MentalModelData): void {
    this.data.set(id, model);
    
    // Track by model name
    const applications = this.modelApplications.get(model.modelName) || [];
    applications.push(model);
    this.modelApplications.set(model.modelName, applications);
  }
  
  /**
   * Get all mental model applications
   * @returns Array of all applications
   */
  getAll(): MentalModelData[] {
    return Array.from(this.data.values());
  }
  
  /**
   * Clear all data
   */
  clear(): void {
    this.data.clear();
    this.modelApplications.clear();
  }
  
  /**
   * Get applications of a specific model
   * @param modelName - The name of the mental model
   * @returns Array of applications for that model
   */
  getByModel(modelName: MentalModelData['modelName']): MentalModelData[] {
    return this.modelApplications.get(modelName) || [];
  }
  
  /**
   * Get all unique problems analyzed
   * @returns Array of unique problem statements
   */
  getUniqueProblems(): string[] {
    const problems = new Set<string>();
    this.data.forEach(model => problems.add(model.problem));
    return Array.from(problems);
  }
  
  /**
   * Get statistics about model usage
   * @returns Object with usage counts per model
   */
  getStatistics(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.modelApplications.forEach((applications, modelName) => {
      stats[modelName] = applications.length;
    });
    return stats;
  }
  
  /**
   * Find models applied to similar problems
   * @param problem - The problem to search for
   * @returns Array of models applied to similar problems
   */
  findSimilarApplications(problem: string): MentalModelData[] {
    const problemLower = problem.toLowerCase();
    return this.filter(model => 
      model.problem.toLowerCase().includes(problemLower) ||
      problemLower.includes(model.problem.toLowerCase())
    );
  }
  
  /**
   * Get the most frequently used model
   * @returns The model name and count, or undefined
   */
  getMostUsedModel(): { modelName: string; count: number } | undefined {
    let maxCount = 0;
    let mostUsed: string | undefined;
    
    this.modelApplications.forEach((applications, modelName) => {
      if (applications.length > maxCount) {
        maxCount = applications.length;
        mostUsed = modelName;
      }
    });
    
    return mostUsed ? { modelName: mostUsed, count: maxCount } : undefined;
  }
}