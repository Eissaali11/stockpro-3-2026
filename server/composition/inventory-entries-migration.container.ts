import { InventoryEntriesMigrationUseCase } from '../application/inventory/use-cases/InventoryEntriesMigration.use-case';

class InventoryEntriesMigrationContainer {
  readonly inventoryEntriesMigrationUseCase = new InventoryEntriesMigrationUseCase();
}

export const inventoryEntriesMigrationContainer = new InventoryEntriesMigrationContainer();
