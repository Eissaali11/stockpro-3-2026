import type { InventoryRequest } from '../../../infrastructure/schemas';

export type UpdateInventoryRequestStatusInput = {
  id: string;
  status: string;
  respondedBy: string;
  adminNotes?: string;
};

export interface IInventoryRequestsManagementRepository {
  updateStatus(input: UpdateInventoryRequestStatusInput): Promise<InventoryRequest>;
  deleteById(id: string): Promise<boolean>;
}
