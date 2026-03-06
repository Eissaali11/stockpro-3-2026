import { InventoryEntriesUseCase } from '../application/inventory/use-cases/InventoryEntries.use-case';
import { DrizzleInventoryEntriesRepository } from '../infrastructure/repositories/inventory/DrizzleInventoryEntriesRepository';

class InventoryEntriesContainer {
  private readonly repository = new DrizzleInventoryEntriesRepository();

  readonly inventoryEntriesUseCase = new InventoryEntriesUseCase(this.repository);
}

export const inventoryEntriesContainer = new InventoryEntriesContainer();
