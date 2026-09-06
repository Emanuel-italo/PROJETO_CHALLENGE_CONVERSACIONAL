import { Pet } from "../types";
import { IPetService } from "../interfaces/IPetService";
import { IPetStorage } from "../interfaces/IStorage";
import { storageService } from "./StorageService";

class PetService implements IPetService {
  constructor(private storage: IPetStorage = storageService) {}

  async getAll(ownerId: string): Promise<Pet[]> {
    const pets = await this.storage.getPets();
    return pets.filter((p) => p.ownerId === ownerId);
  }

  async getById(id: string, ownerId: string): Promise<Pet | null> {
    const pets = await this.getAll(ownerId);
    return pets.find((p) => p.id === id) ?? null;
  }

  async save(pet: Pet): Promise<void> {
    const pets = await this.storage.getPets();
    const idx = pets.findIndex((p) => p.id === pet.id);
    if (idx >= 0) pets[idx] = pet;
    else pets.push(pet);
    await this.storage.savePets(pets);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const pets = await this.storage.getPets();
    await this.storage.savePets(
      pets.filter((p) => !(p.id === id && p.ownerId === ownerId)),
    );
  }

  getHealthScore(pet: Pet): number {
    if (!pet.vaccines || pet.vaccines.length === 0) return 100;
    const done = pet.vaccines.filter((v) => v.done).length;
    return Math.round((done / pet.vaccines.length) * 100);
  }
}

export const petService = new PetService();
