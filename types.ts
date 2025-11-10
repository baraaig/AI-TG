
export interface Course {
  id: string;
  name: string;
  code: string;
  hours: number;
  category: 'compulsory' | 'elective';
  level: number;
}

export interface Instructor {
  id: string;
  name:string;
  maxHours: number;
  twoDaysOnly: boolean;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
}

export interface ScheduleEntry {
  id: string;
  courseId: string;
  instructorId: string;
  roomId: string;
  day: string;
  startTime: string;
  endTime: string;
}