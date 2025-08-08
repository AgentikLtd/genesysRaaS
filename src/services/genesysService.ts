// src/services/genesysService.ts
import platformClient from 'purecloud-platform-client-v2';
import { v4 as uuidv4 } from 'uuid';

/**
 * Genesys Cloud Service
 * Handles all interactions with Genesys Cloud APIs including authentication,
 * data table operations, and rules management
 */
class GenesysService {
  private client: typeof platformClient;
  private initialised: boolean = false;

  constructor() {
    this.client = platformClient;
  }

  /**
   * Initialize the platform client
   */
  async initialise(): Promise<void> {
    if (this.initialised) return;

    try {
      // Set the environment (region)
      const environment = import.meta.env.VITE_GENESYS_ENVIRONMENT || 'mypurecloud.com';
      this.client.ApiClient.instance.setEnvironment(environment);

      // Check if we have a token from a previous session
      const savedAuth = this.getPersistedAuth();
      if (savedAuth && savedAuth.accessToken) {
        console.debug('Found saved auth token, setting up session');
        this.client.ApiClient.instance.setAccessToken(savedAuth.accessToken);
        this.client.ApiClient.instance.authData = savedAuth;
      } else {
        console.debug('No valid saved auth token found');
      }

      this.initialised = true;
    } catch (error) {
      console.error('Failed to initialize Genesys client:', error);
      throw error;
    }
  }

  /**
   * Get persisted auth data from storage
   */
  private getPersistedAuth(): any {
    if (typeof window !== 'undefined' && window.localStorage) {
      const authData = window.localStorage.getItem('genesys_auth');
      if (authData) {
        try {
          let parsedData;
          
          // Try to decode as base64 first (new format)
          try {
            const decoded = atob(authData);
            parsedData = JSON.parse(decoded);
          } catch {
            // Fall back to plain JSON (old format for compatibility)
            parsedData = JSON.parse(authData);
          }
          
          // Check if token is too old (24 hours) - only if timestamp exists
          if (parsedData.timestamp && Date.now() - parsedData.timestamp > 24 * 60 * 60 * 1000) {
            window.localStorage.removeItem('genesys_auth');
            return null;
          }
          
          // Check if token has expired based on tokenExpiryTime
          if (parsedData.tokenExpiryTime && Date.now() > parsedData.tokenExpiryTime) {
            window.localStorage.removeItem('genesys_auth');
            return null;
          }
          
          return parsedData;
        } catch (error) {
          console.warn('Failed to parse stored auth data:', error);
          // If parsing fails, remove invalid data
          window.localStorage.removeItem('genesys_auth');
          return null;
        }
      }
    }
    return null;
  }

  /**
   * Persist auth data to storage with basic encryption
   */
  private persistAuth(authData: any): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        // Basic obfuscation - better than plain text but not cryptographic security
        const dataToStore = {
          ...authData,
          timestamp: Date.now()
        };
        const encoded = btoa(JSON.stringify(dataToStore));
        window.localStorage.setItem('genesys_auth', encoded);
        console.debug('Auth data persisted successfully');
      } catch (error) {
        console.warn('Failed to persist auth data:', error);
        // Fallback to plain JSON storage
        try {
          window.localStorage.setItem('genesys_auth', JSON.stringify(authData));
        } catch (fallbackError) {
          console.error('Failed to store auth data even as plain JSON:', fallbackError);
        }
      }
    }
  }

  /**
   * Login using implicit grant (browser-based OAuth)
   */
  async login(state?: string): Promise<void> {
    try {
      await this.initialise();
      
      const clientId = import.meta.env.VITE_GENESYS_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_REDIRECT_URI;

      if (!clientId || !redirectUri) {
        throw new Error('Missing OAuth configuration');
      }

      // Initiate the implicit grant login flow
      // This will redirect the user to the Genesys login page
      await this.client.ApiClient.instance.loginImplicitGrant(
        clientId,
        redirectUri,
        { state }
      );
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback after login
   */
  async handleAuthCallback(): Promise<string | null> {
    try {
      await this.initialise();
      
      // Parse the token from the URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const state = hashParams.get('state');

      if (accessToken) {
        // Set the access token
        this.client.ApiClient.instance.setAccessToken(accessToken);
        
        // Store auth data
        const authData = {
          accessToken,
          tokenExpiryTime: Date.now() + (8 * 60 * 60 * 1000), // 8 hours
          state
        };
        
        this.client.ApiClient.instance.authData = authData;
        this.persistAuth(authData);

        // Clear the hash from the URL
        window.history.replaceState(null, '', window.location.pathname);

        return state ? decodeURIComponent(state) : null;
      }

      throw new Error('No access token found in callback');
    } catch (error) {
      console.error('Auth callback failed:', error);
      throw error;
    }
  }

  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean {
    const authData = this.client.ApiClient.instance.authData || this.getPersistedAuth();
    
    if (!authData || !authData.accessToken) {
      return false;
    }

    // Check if token is expired
    if (authData.tokenExpiryTime && Date.now() > authData.tokenExpiryTime) {
      // Token is expired
      this.logout();
      return false;
    }

    // Set the token if we have it from storage
    if (authData.accessToken && !this.client.ApiClient.instance.authData) {
      this.client.ApiClient.instance.setAccessToken(authData.accessToken);
      this.client.ApiClient.instance.authData = authData;
    }

    return true;
  }

  /**
   * Check if authentication is needed (inverse of isAuthenticated)
   */
  needsAuthentication(): boolean {
    const authData = this.client.ApiClient.instance.authData || this.getPersistedAuth();
    return !(authData && authData.accessToken);
  }

  /**
   * Get the current access token
   */
  getAccessToken(): string | null {
    const authData = this.client.ApiClient.instance.authData;
    return authData?.accessToken || null;
  }

  /**
   * Clear all authentication data
   */
  clearAuthData(): void {
    try {
      // Clear in-memory auth data
      this.client.ApiClient.instance.setAccessToken(null);
      this.client.ApiClient.instance.authData = {};
      
      // Clear persisted auth data
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('genesys_auth');
        window.sessionStorage.removeItem('auth_backup');
      }
      
      console.debug('All auth data cleared');
    } catch (error) {
      console.warn('Error clearing auth data:', error);
    }
  }

  /**
   * Logout the user
   */
  async logout(): Promise<void> {
    try {
      this.clearAuthData();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Get the authenticated user's profile
   */
  async getUserProfile(): Promise<any> {
    try {
      await this.initialise();
      
      const usersApi = new this.client.UsersApi();
      const user = await usersApi.getUsersMe();
      return user;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Deploy rules to the data table with robust version management
   */
  async deployRules(rulesConfig: any, description: string): Promise<void> {
    try {
      await this.initialise();
      
      const architectApi = new this.client.ArchitectApi();
      const tableId = import.meta.env.VITE_RULES_TABLE_ID;
      
      if (!tableId) {
        throw new Error('Rules table ID not configured');
      }

      // Get current user for audit trail
      const user = await this.getUserProfile();
      
      // Get current active rules to determine next version
      const activeRules = await this.getActiveRules();
      const nextVersion = (activeRules?.version || 0) + 1;
      
      // Create new rule entry matching the original schema
      const ruleEntry = {
        key: uuidv4(),
        rules: JSON.stringify(rulesConfig),
        version: String(nextVersion), // Keep as string to match original
        description: description,
        deployedBy: user.email,
        deployedAt: new Date().toISOString(),
        isActive: true
      };

      // If there's an active rule, deactivate it first
      if (activeRules) {
        await this.deactivateRule(activeRules.key);
      }

      // Create the new rule entry - no body wrapper for POST
      await architectApi.postFlowsDatatableRows(tableId, ruleEntry);
      
      console.log(`Successfully deployed rules version ${nextVersion}`);
    } catch (error: any) {
      console.error('Deploy rules error:', error);
      throw new Error(error.message || 'Failed to deploy rules');
    }
  }

  /**
   * Get the currently active rules
   */
  async getActiveRules(): Promise<any> {
    try {
      await this.initialise();
      
      const architectApi = new this.client.ArchitectApi();
      const tableId = import.meta.env.VITE_RULES_TABLE_ID;
      
      if (!tableId) {
        throw new Error('Rules table ID not configured');
      }

      // Query for active rules
      const response = await architectApi.getFlowsDatatableRows(tableId, {
        pageSize: 100,
        pageNumber: 1,
        showbrief: false
      });
      
      if (response.entities && response.entities.length > 0) {
        // Filter for active rules client-side
        const activeRule = response.entities.find((row: any) => row.isActive === true);
        
        if (activeRule) {
          return {
            key: activeRule.key,
            version: parseInt(activeRule.version, 10),
            rules: JSON.parse(activeRule.rules),
            createdAt: activeRule.deployedAt,
            createdBy: activeRule.deployedBy,
            description: activeRule.description
          };
        }
      }
      
      return null;
    } catch (error: any) {
      console.error('Get active rules error:', error);
      // Return null if no rules found
      return null;
    }
  }

  /**
   * Deactivate a rule by key (private helper method)
   */
  private async deactivateRule(key: string): Promise<void> {
    try {
      const architectApi = new this.client.ArchitectApi();
      const tableId = import.meta.env.VITE_RULES_TABLE_ID;
      
      // Get the full row data first
      const currentRow = await architectApi.getFlowsDatatableRow(
        tableId,
        key,
        { showbrief: false }
      );
      
      // Update with all fields, just changing isActive
      const updateBody = {
        key: currentRow.key,
        rules: currentRow.rules,
        version: currentRow.version,
        description: currentRow.description,
        deployedBy: currentRow.deployedBy,
        deployedAt: currentRow.deployedAt,
        isActive: false
      };

      await architectApi.putFlowsDatatableRow(tableId, key, { body: updateBody });
    } catch (error: any) {
      console.error('Deactivate rule error:', error);
      throw new Error('Failed to deactivate previous rule version');
    }
  }

  /**
   * Get rules version history
   */
  async getRulesHistory(pageNumber: number = 1, pageSize: number = 20): Promise<any> {
    try {
      await this.initialise();
      
      const architectApi = new this.client.ArchitectApi();
      const tableId = import.meta.env.VITE_RULES_TABLE_ID;
      
      if (!tableId) {
        throw new Error('Rules table ID not configured');
      }

      // Get all rules
      const response = await architectApi.getFlowsDatatableRows(tableId, {
        pageSize: Math.min(pageSize, 200),
        pageNumber: pageNumber,
        showbrief: false
      });
      
      // Sort by version
      const versions = (response.entities || [])
        .map((rule: any) => ({
          key: rule.key,
          name: `Rules v${rule.version}`,
          version: parseInt(rule.version, 10),
          active: rule.isActive,
          rules: JSON.parse(rule.rules),
          createdBy: rule.deployedBy,
          createdAt: rule.deployedAt,
          description: rule.description
        }))
        .sort((a: any, b: any) => b.version - a.version);
      
      return {
        entities: versions,
        total: response.total,
        pageCount: response.pageCount,
        pageSize: response.pageSize,
        pageNumber: response.pageNumber
      };
    } catch (error: any) {
      console.error('Get rules history error:', error);
      throw new Error('Failed to load rules history');
    }
  }

  /**
   * Activate a specific version (rollback functionality)
   */
  async activateVersion(key: string): Promise<void> {
    try {
      await this.initialise();
      
      const architectApi = new this.client.ArchitectApi();
      const tableId = import.meta.env.VITE_RULES_TABLE_ID;
      const user = await this.getUserProfile();
      
      // Get the version to activate
      const targetVersion = await architectApi.getFlowsDatatableRow(
        tableId,
        key,
        { showbrief: false }
      );
      
      if (!targetVersion) {
        throw new Error('Version not found');
      }
      
      // Step 1: Deactivate all currently active versions
      const allRows = await architectApi.getFlowsDatatableRows(tableId, {
        pageSize: 200,
        pageNumber: 1,
        showbrief: false
      });
      
      for (const row of allRows.entities || []) {
        if (row.isActive === true && row.key !== key) {
          const deactivatedRow = {
            key: row.key,
            rules: row.rules,
            version: row.version,
            description: row.description,
            deployedBy: row.deployedBy,
            deployedAt: row.deployedAt,
            isActive: false
          };
          
          await architectApi.putFlowsDatatableRow(
            tableId,
            row.key,
            { body: deactivatedRow }
          );
        }
      }
      
      // Step 2: Activate the target version
      const activatedRow = {
        key: targetVersion.key,
        rules: targetVersion.rules,
        version: targetVersion.version,
        description: targetVersion.description,
        deployedBy: targetVersion.deployedBy,
        deployedAt: targetVersion.deployedAt,
        isActive: true
      };
      
      await architectApi.putFlowsDatatableRow(
        tableId,
        key,
        { body: activatedRow }
      );
      
      console.log(`Successfully activated version ${targetVersion.version}`);
    } catch (error: any) {
      console.error('Activate version error:', error);
      throw new Error('Failed to activate version');
    }
  }

  /**
   * Delete multiple versions (for cleanup functionality)
   * Will NOT delete active versions to prevent accidental data loss
   */
  async deleteVersions(keys: string[]): Promise<{ deleted: string[], skipped: string[], errors: string[] }> {
    try {
      await this.initialise();
      
      const architectApi = new this.client.ArchitectApi();
      const tableId = import.meta.env.VITE_RULES_TABLE_ID;
      
      if (!tableId) {
        throw new Error('Rules table ID not configured');
      }

      const results = {
        deleted: [] as string[],
        skipped: [] as string[],
        errors: [] as string[]
      };

      // Process each key individually
      for (const key of keys) {
        try {
          // Get the row to check if it's active
          const row = await architectApi.getFlowsDatatableRow(
            tableId,
            key,
            { showbrief: false }
          );
          
          // Skip if this is the active version
          if (row.isActive === true) {
            results.skipped.push(key);
            console.log(`Skipped deleting active version: ${key}`);
            continue;
          }
          
          // Delete the version
          await architectApi.deleteFlowsDatatableRow(tableId, key);
          results.deleted.push(key);
          console.log(`Successfully deleted version: ${key}`);
          
        } catch (error: any) {
          console.error(`Failed to delete version ${key}:`, error);
          results.errors.push(key);
        }
      }
      
      return results;
    } catch (error: any) {
      console.error('Delete versions error:', error);
      throw new Error('Failed to delete versions');
    }
  }

  /**
   * Save execution log
   */
  async saveExecutionLog(logEntry: {
    input: any;
    output: string;
    rulesVersion: number;
    executionTime: number;
    matchedRules: string[];
    error?: string;
    traceId?: string;
  }): Promise<void> {
    try {
      await this.initialise();
      
      const architectApi = new this.client.ArchitectApi();
      const tableId = import.meta.env.VITE_LOGS_TABLE_ID;
      
      if (!tableId) {
        console.warn('Logs table ID not configured - skipping log');
        return;
      }

      const log = {
        key: uuidv4(),
        timestamp: new Date().toISOString(),
        input: JSON.stringify(logEntry.input),
        output: logEntry.output,
        rulesVersion: String(logEntry.rulesVersion),
        executionTime: String(logEntry.executionTime),
        matchedRules: logEntry.matchedRules.join(','),
        error: logEntry.error || '',
        traceId: logEntry.traceId || uuidv4()
      };

      await architectApi.postFlowsDatatableRows(tableId, log);
    } catch (error: any) {
      // Log errors but don't throw - logging shouldn't break execution
      console.error('Save execution log error:', error);
    }
  }


  /**
   * Get the API client instance for making custom API calls
   */
  getClient(): typeof platformClient {
    return this.client;
  }
}

// Export singleton instance
export const genesysService = new GenesysService();
export default genesysService;