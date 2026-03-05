/**
 * Services Export Module
 * Provides clean exports for all application services
 */

// Export individual services
export { InventoryService } from "./inventory.service";
export { UserService } from "./user.service";
export { WarehouseService } from "./warehouse.service";
export { TechnicianService } from "./technician.service";
export { SystemAnalyticsService } from "./analytics.service";
export { DevicesService } from "./devices.service";
export { RegionsService } from "./regions.service";
export { ItemTypesService } from "./item-types.service";
export { TransactionsService } from "./transactions.service";

// Export service factory
export { ServiceFactory, services } from "./index";

// Re-export for backward compatibility
export { services as storage } from "./index";