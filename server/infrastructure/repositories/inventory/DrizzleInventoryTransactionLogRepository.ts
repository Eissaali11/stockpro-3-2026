import { transactions } from '../../schemas';
import type { CreateInventoryTransactionInput } from '../../../application/inventory/contracts/IInventoryTransactionLogRepository';

export class DrizzleInventoryTransactionLogRepository {
  constructor(private readonly executor: any) {}

  async create(input: CreateInventoryTransactionInput): Promise<void> {
    await this.executor.insert(transactions).values({
      itemId: input.itemId,
      userId: input.userId,
      type: input.type,
      quantity: input.quantity,
      reason: input.reason,
    });
  }
}
