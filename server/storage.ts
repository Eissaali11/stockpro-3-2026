export type { IStorage } from "./core/interfaces/IStorage";
export { MemStorage } from "./core/storage/MemStorage";

export {
	compositionRoot,
	storage,
	adminDashboardContainer,
	bootstrapDefaultsContainer,
	inventoryContainer,
	inventoryEntriesContainer,
	inventoryEntriesMigrationContainer,
	inventoryRequestsApprovalContainer,
	inventoryRequestsCreateContainer,
	inventoryRequestsManagementContainer,
	stockFixedInventoryContainer,
	stockTransferContainer,
	supervisorAssignmentsContainer,
	supervisorUsersContainer,
	techniciansContainer,
	transactionsContainer,
	usersContainer,
	createGetTechnicianMovingInventoryUseCase,
	createWithdrawTechnicianInventoryToWarehouseUseCase,
} from "./composition";
