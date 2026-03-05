// Repository Implementations and Interfaces
export * from './UserRepository';
export * from './SupervisorRepository';
export * from './WarehouseRepository';
export * from './WarehouseInventoryRepository';
export * from './TechnicianInventoryRepository';
export * from './InventoryRequestsRepository';
export * from './TransferRepository';
export * from './TransferQueryRepository';
export * from './TransferExecutionRepository';

// Import all implementations
import { UserRepository } from './UserRepository';
import { SupervisorRepository } from './SupervisorRepository';
import { WarehouseRepository } from './WarehouseRepository';
import { WarehouseInventoryRepository } from './WarehouseInventoryRepository';
import { TechnicianInventoryRepository } from './TechnicianInventoryRepository';
import { InventoryRequestsRepository } from './InventoryRequestsRepository';
import { TransferRepository } from './TransferRepository';

// Repository Instances (Singleton pattern)
export const repositories = {
  user: new UserRepository(),
  supervisor: new SupervisorRepository(),
  warehouse: new WarehouseRepository(),
  warehouseInventory: new WarehouseInventoryRepository(),
  technicianInventory: new TechnicianInventoryRepository(),
  inventoryRequests: new InventoryRequestsRepository(),
  transfer: new TransferRepository(),
};

// Type definitions for the repository container
export type Repositories = typeof repositories;

// Default export for convenience
export default repositories;