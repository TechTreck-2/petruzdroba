export interface LeaveSlip {
  id?:number,
  userId?:number,
  date: Date;
  startTime: Date;
  endTime: Date;
  description: string;
  status: 'pending' | 'accepted' | 'denied' | 'ignored' | 'PENDING' | 'ACCEPTED' | 'DENIED' | 'IGNORED';
}
