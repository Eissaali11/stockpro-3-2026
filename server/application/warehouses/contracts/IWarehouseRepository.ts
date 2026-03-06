import type { WarehouseWithStats } from '../../../infrastructure/schemas';

export interface IWarehouseRepository {
  getWarehouses(): Promise<WarehouseWithStats[]>;
}
