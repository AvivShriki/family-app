export interface FamilyEvent {
  id: string;
  title: string;
  date: string; // ISO string
  time?: string;
  note?: string;
  createdBy: string;
  createdAt: number;
}

export interface ShoppingItem {
  id: string;
  text: string;
  checked: boolean;
  addedBy: string;
  createdAt: number;
}

export interface BabyLog {
  id: string;
  type: 'feeding' | 'sleep' | 'diaper' | 'note';
  timestamp: number;
  details?: string;
  // feeding
  feedingType?: 'breast_left' | 'breast_right' | 'bottle';
  durationMin?: number;
  amountMl?: number;
  // sleep
  endTimestamp?: number;
  // diaper
  diaperType?: 'wet' | 'dirty' | 'both';
  loggedBy: string;
}
