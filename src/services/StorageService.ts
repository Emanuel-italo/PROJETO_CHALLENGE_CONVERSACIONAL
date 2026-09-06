import AsyncStorage from "@react-native-async-storage/async-storage";

import { Pet } from "../types";
import { IStorage } from "../interfaces/IStorage";

class StorageService implements IStorage {
  async getPets(): Promise<Pet[]> {
    const raw = await AsyncStorage.getItem("pets");
    return raw ? JSON.parse(raw) : [];
  }

  async savePets(pets: Pet[]): Promise<void> {
    await AsyncStorage.setItem("pets", JSON.stringify(pets));
  }

  async getData(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async saveData(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }
}

export const storageService = new StorageService();
