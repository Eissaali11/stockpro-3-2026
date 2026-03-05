import { DatabaseStorage } from './database-storage';

const storage = new DatabaseStorage();

export default storage;
export { storage, DatabaseStorage };
export * from './infrastructure/schemas';
