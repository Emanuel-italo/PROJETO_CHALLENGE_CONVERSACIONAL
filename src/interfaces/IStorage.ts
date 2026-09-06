import { Pet } from "../types";

export interface IPetStorage {
  savePets(pets: Pet[]): Promise<void>;
  getPets(): Promise<Pet[]>;
}

export interface IKeyValueStorage {
  getData(key: string): Promise<string | null>;
  saveData(key: string, value: string): Promise<void>;
}

export interface IStorage extends IPetStorage, IKeyValueStorage {}
