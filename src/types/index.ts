export interface Vaccine {
  id: string;
  name: string;
  date: string;
  nextDue: string;
  done: boolean;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  color: string;
  ownerId: string;
  vaccines: Vaccine[];
  medications: Medication[];
  nextCheckup: string;
  createdAt: string;
}

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  VerifyEmail: undefined;
  Main: undefined;
  AddPet: { petId?: string } | undefined;
  PetDetail: { petId: string };
  HealthCalendar: undefined;
  PetChat: undefined;
  Vaccines: undefined;
  Medications: undefined;
  Pending: undefined;
  AddHealthRecord: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Pets: undefined;
  Health: undefined;
  Calendar: undefined;
  Profile: undefined;
};
