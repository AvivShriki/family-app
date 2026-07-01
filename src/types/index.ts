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
  type: 'feeding' | 'sleep' | 'diaper' | 'note' | 'vitamin' | 'iron';
  timestamp: number;       // start time (ms)
  endTimestamp?: number;   // sleep end time (ms)
  details?: string;
  // feeding
  amountMl?: number;
  // sleep — duration derived from endTimestamp - timestamp
  // diaper
  diaperType?: 'wet' | 'dirty' | 'both';
  loggedBy: string;
}
