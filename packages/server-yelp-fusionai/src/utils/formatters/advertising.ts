/**
 * Advertising-related formatters
 */

/**
 * Format the advertising program response
 */
export function formatAdvertisingProgramResponse(response: any): string {
  if (!response) {
    return 'Advertising program details not found.';
  }

  const { 
    program_id, business_id, status, budget, start_date, end_date,
    objectives, ad_type, geo_targeting, metrics, created_at, updated_at 
  } = response;

  let result = `# Advertising Program: ${program_id}
**Business ID:** ${business_id}
**Status:** ${status}
**Budget:** $${(budget / 100).toFixed(2)}
**Start Date:** ${new Date(start_date).toLocaleDateString()}`;

  if (end_date) {
    result += `\n**End Date:** ${new Date(end_date).toLocaleDateString()}`;
  }

  if (objectives && objectives.length > 0) {
    result += `\n**Objectives:** ${objectives.join(', ')}`;
  }

  if (ad_type) {
    result += `\n**Ad Type:** ${ad_type}`;
  }

  if (geo_targeting) {
    result += '\n\n### Geographic Targeting:';
    if (geo_targeting.location) {
      result += `\n**Location:** ${geo_targeting.location}`;
    }
    if (geo_targeting.radius) {
      result += `\n**Radius:** ${geo_targeting.radius} meters`;
    }
    if (geo_targeting.latitude && geo_targeting.longitude) {
      result += `\n**Coordinates:** ${geo_targeting.latitude}, ${geo_targeting.longitude}`;
    }
  }

  if (metrics) {
    result += '\n\n### Performance Metrics:';
    if (metrics.impressions !== undefined) {
      result += `\n**Impressions:** ${metrics.impressions}`;
    }
    if (metrics.clicks !== undefined) {
      result += `\n**Clicks:** ${metrics.clicks}`;
    }
    if (metrics.ctr !== undefined) {
      result += `\n**CTR:** ${(metrics.ctr * 100).toFixed(2)}%`;
    }
    if (metrics.spend !== undefined) {
      result += `\n**Spend:** $${(metrics.spend / 100).toFixed(2)}`;
    }
  }

  if (created_at) {
    result += `\n\n**Created:** ${new Date(created_at).toLocaleString()}`;
  }
  
  if (updated_at) {
    result += `\n**Last Updated:** ${new Date(updated_at).toLocaleString()}`;
  }

  return result;
}

/**
 * Format the advertising program list response
 */
export function formatAdvertisingProgramListResponse(response: any): string {
  const { programs, total } = response;
  if (!programs || programs.length === 0) {
    return 'No advertising programs found.';
  }

  const formattedPrograms = programs.map((program: any) => {
    const { program_id, business_id, status, budget, start_date, end_date, objectives } = program;
    
    return `## Program: ${program_id}
**Business ID:** ${business_id}
**Status:** ${status}
**Budget:** $${(budget / 100).toFixed(2)}
**Start Date:** ${new Date(start_date).toLocaleDateString()}
${end_date ? `**End Date:** ${new Date(end_date).toLocaleDateString()}` : ''}
**Objectives:** ${objectives && objectives.length > 0 ? objectives.join(', ') : 'None specified'}`;
  }).join('\n\n');

  return `Found ${total} advertising programs. Showing ${programs.length}:\n\n${formattedPrograms}`;
}

/**
 * Format the advertising program status response
 */
export function formatAdvertisingProgramStatusResponse(response: any): string {
  if (!response) {
    return 'Program status not available.';
  }

  const { program_id, status, details, budget_status } = response;

  let result = `### Advertising Program Status
**Program ID:** ${program_id}
**Status:** ${status}`;

  if (details) {
    result += '\n\n**Status Details:**';
    if (details.reason) {
      result += `\n- Reason: ${details.reason}`;
    }
    if (details.last_updated) {
      result += `\n- Last Updated: ${new Date(details.last_updated).toLocaleString()}`;
    }
    if (details.days_active) {
      result += `\n- Days Active: ${details.days_active}`;
    }
    if (details.days_remaining) {
      result += `\n- Days Remaining: ${details.days_remaining}`;
    }
  }

  if (budget_status) {
    result += '\n\n**Budget Status:**';
    if (budget_status.total_budget) {
      result += `\n- Total Budget: $${(budget_status.total_budget / 100).toFixed(2)}`;
    }
    if (budget_status.spent) {
      result += `\n- Spent: $${(budget_status.spent / 100).toFixed(2)}`;
    }
    if (budget_status.remaining) {
      result += `\n- Remaining: $${(budget_status.remaining / 100).toFixed(2)}`;
    }
    if (budget_status.daily_spend) {
      result += `\n- Daily Spend: $${(budget_status.daily_spend / 100).toFixed(2)}`;
    }
  }

  return result;
}