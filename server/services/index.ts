import { InventoryService } from "./inventory.service";
import { UserService } from "./user.service";
import { WarehouseService } from "./warehouse.service";
import { TechnicianService } from "./technician.service";
import { SystemAnalyticsService } from "./analytics.service";
import { DevicesService } from "./devices.service";
import { RegionsService } from "./regions.service";
import { ItemTypesService } from "./item-types.service";
import { TransactionsService } from "./transactions.service";

/**
 * Service Factory
 * Provides centralized access to all application services
 * Implements Singleton pattern for performance and consistency
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  
  private _inventoryService: InventoryService;
  private _userService: UserService;
  private _warehouseService: WarehouseService;
  private _technicianService: TechnicianService;
  private _analyticsService: SystemAnalyticsService;
  private _devicesService: DevicesService;
  private _regionsService: RegionsService;
  private _itemTypesService: ItemTypesService;
  private _transactionsService: TransactionsService;

  private constructor() {
    // Initialize all services
    this._inventoryService = new InventoryService();
    this._userService = new UserService();
    this._warehouseService = new WarehouseService();
    this._technicianService = new TechnicianService();
    this._analyticsService = new SystemAnalyticsService();
    this._devicesService = new DevicesService();
    this._regionsService = new RegionsService();
    this._itemTypesService = new ItemTypesService();
    this._transactionsService = new TransactionsService();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  /**
   * Get Inventory Service
   */
  get inventory(): InventoryService {
    return this._inventoryService;
  }

  /**
   * Get User Service
   */
  get users(): UserService {
    return this._userService;
  }

  /**
   * Get Warehouse Service
   */
  get warehouses(): WarehouseService {
    return this._warehouseService;
  }

  /**
   * Get Technician Service
   */
  get technicians(): TechnicianService {
    return this._technicianService;
  }

  /**
   * Get Analytics Service
   */
  get analytics(): SystemAnalyticsService {
    return this._analyticsService;
  }

  /**
   * Get Devices Service
   */
  get devices(): DevicesService {
    return this._devicesService;
  }

  /**
   * Get Regions Service
   */
  get regions(): RegionsService {
    return this._regionsService;
  }

  /**
   * Get Item Types Service
   */
  get itemTypes(): ItemTypesService {
    return this._itemTypesService;
  }

  /**
   * Get Transactions Service
   */
  get transactions(): TransactionsService {
    return this._transactionsService;
  }

  /**
   * Initialize all services (if needed)
   */
  public async initialize(): Promise<void> {
    // Item types are managed manually (or via import flows), not auto-seeded.
    return;
  }

  /**
   * Health check for all services
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, 'ok' | 'error'>;
    timestamp: Date;
  }> {
    const serviceChecks: Record<string, 'ok' | 'error'> = {};
    let errorCount = 0;

    // Test basic operations for each service
    const checks = [
      { name: 'inventory', test: () => this._inventoryService.getInventoryItems() },
      { name: 'users', test: () => this._userService.getUsers() },
      { name: 'warehouses', test: () => this._warehouseService.getWarehouses() },
      { name: 'technicians', test: () => this._technicianService.getTechniciansInventory() },
      { name: 'analytics', test: () => this._analyticsService.getDashboardStats() },
      { name: 'devices', test: () => this._devicesService.getWithdrawnDevices() },
      { name: 'regions', test: () => this._regionsService.getRegions() },
      { name: 'itemTypes', test: () => this._itemTypesService.getItemTypes() },
      { name: 'transactions', test: () => this._transactionsService.getRecentTransactions(1) }
    ];

    await Promise.all(
      checks.map(async ({ name, test }) => {
        try {
          await test();
          serviceChecks[name] = 'ok';
        } catch (error) {
          console.error(`Service health check failed for ${name}:`, error);
          serviceChecks[name] = 'error';
          errorCount++;
        }
      })
    );

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (errorCount === 0) {
      status = 'healthy';
    } else if (errorCount < checks.length / 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      services: serviceChecks,
      timestamp: new Date()
    };
  }
}

/**
 * Service Factory Instance
 * Global singleton instance for easy access
 */
export const services = ServiceFactory.getInstance();