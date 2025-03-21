#!/bin/bash

# Define directories to create templates for
DIRS=(
  "advertising"
  "business-subscriptions"
  "checkout"
  "claim-business"
  "data-ingestion"
  "fulfillment"
  "leads"
  "listing-management"
  "location-subscription-v1"
  "location-subscription-v2"
  "partner-support"
  "program-feature"
  "reporting-v2"
  "reporting-v3"
  "reservations"
  "respond-reviews"
  "waitlist-partner"
  "webhooks"
)

# Base path for API services
BASE_PATH="/Users/b.c.nims/MCP/Waldzell MCP/packages/yelp-fusionai-mcp/src/services/api"

# Template content
generate_template() {
  local dir_name=$1
  local class_name=$(echo "${dir_name^}" | sed 's/-//g')
  
  # Convert kebab-case to PascalCase
  class_name=$(echo $dir_name | sed -E 's/(^|-)([a-z])/\U\2/g' | sed 's/-//g')
  
  cat <<EOF
import { BaseApiClient } from '../base';

/**
 * Yelp ${class_name} API client
 */
export class ${class_name}Client extends BaseApiClient {
  /**
   * Placeholder method
   */
  async getResources(): Promise<any> {
    return this.get<any>('/v3/${dir_name}/resources');
  }
}

export default new ${class_name}Client();
EOF
}

# Generate templates for each directory
for dir in "${DIRS[@]}"; do
  echo "Generating template for $dir"
  mkdir -p "${BASE_PATH}/${dir}"
  generate_template "$dir" > "${BASE_PATH}/${dir}/index.ts"
done

echo "Templates generated successfully!"