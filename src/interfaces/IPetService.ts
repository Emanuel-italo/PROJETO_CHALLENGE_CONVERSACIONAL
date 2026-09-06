import { Pet } from "../types";

export interface IPetService {
  getAll(ownerId: string): Promise<Pet[]>;
  getById(id: string, ownerId: string): Promise<Pet | null>;
  save(pet: Pet): Promise<void>;
  remove(id: string, ownerId: string): Promise<void>;
  getHealthScore(pet: Pet): number;
}
