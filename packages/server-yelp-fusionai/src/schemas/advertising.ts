/**
 * Schemas for advertising-related endpoints
 */
import { z } from 'zod';

// Schema for creating an advertising program
export const yelpCreateAdProgramSchema = z.object({
  business_id: z.string().describe('The business ID to create a program for'),
  budget: z.number().describe('Monthly budget in USD'),
  objectives: z.array(z.string()).describe('Advertising objectives'),
  name: z.string().optional().describe('Program name'),
  start_date: z.string().optional().describe('Program start date (YYYY-MM-DD)'),
  end_date: z.string().optional().describe('Program end date (YYYY-MM-DD)')
});

// Schema for listing advertising programs
export const yelpListAdProgramsSchema = z.object({
  business_id: z.string().describe('The business ID to list programs for'),
  status: z.enum(['active', 'paused', 'terminated', 'all']).optional().describe('Filter by program status')
});

// Schema for getting an advertising program
export const yelpGetAdProgramSchema = z.object({
  program_id: z.string().describe('The program ID to get details for')
});

// Schema for modifying an advertising program
export const yelpModifyAdProgramSchema = z.object({
  program_id: z.string().describe('The program ID to modify'),
  budget: z.number().optional().describe('New monthly budget in USD'),
  name: z.string().optional().describe('New program name'),
  objectives: z.array(z.string()).optional().describe('New advertising objectives'),
  end_date: z.string().optional().describe('New program end date (YYYY-MM-DD)')
});

// Schema for getting advertising program status
export const yelpAdProgramStatusSchema = z.object({
  program_id: z.string().describe('The program ID to get status for')
});

// Schema for pausing an advertising program
export const yelpPauseAdProgramSchema = z.object({
  program_id: z.string().describe('The program ID to pause')
});

// Schema for resuming an advertising program
export const yelpResumeAdProgramSchema = z.object({
  program_id: z.string().describe('The program ID to resume')
});

// Schema for terminating an advertising program
export const yelpTerminateAdProgramSchema = z.object({
  program_id: z.string().describe('The program ID to terminate')
});