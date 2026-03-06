import {
  GetTransactionsUseCase,
  GetTransactionStatisticsUseCase,
} from '../application/transactions/use-cases/TransactionsRead.use-case';
import { DrizzleTransactionsReadRepository } from '../infrastructure/repositories/transactions/DrizzleTransactionsReadRepository';

class TransactionsContainer {
  private readonly repository = new DrizzleTransactionsReadRepository();

  readonly getTransactionsUseCase = new GetTransactionsUseCase(this.repository);
  readonly getTransactionStatisticsUseCase = new GetTransactionStatisticsUseCase(this.repository);
}

export const transactionsContainer = new TransactionsContainer();
