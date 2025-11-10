
import { GoogleGenAI, Type } from "@google/genai";
import { Course, Instructor, Room, ScheduleEntry } from '../types';
// fix: Removed unused import 'TIME_SLOTS' which is not exported from constants.ts
import { DAYS_OF_WEEK } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        courseCode: {
          type: Type.STRING,
          description: 'The code of the course for this specific session.',
        },
        instructorName: {
          type: Type.STRING,
          description: 'The name of the instructor teaching the session.',
        },
        roomName: {
          type: Type.STRING,
          description: 'The name of the room for the session.',
        },
        day: {
          type: Type.STRING,
          description: 'The day of the week for the session.',
        },
        timeSlot: {
            type: Type.STRING,
            description: 'The time slot for the session, e.g., "08:00 - 08:50".',
        }
      },
      required: ["courseCode", "instructorName", "roomName", "day", "timeSlot"],
    },
};

export const generateTimetable = async (
  courses: Course[],
  instructors: Instructor[],
  rooms: Room[],
  assignments: Record<string, string[]> // courseId -> instructorId[]
): Promise<any[]> => {

  const formattedAssignments = Object.entries(assignments)
    .map(([courseId, instructorIds]) => {
        const course = courses.find(c => c.id === courseId);
        const instructorNames = instructorIds
            .map(id => instructors.find(i => i.id === id)?.name)
            .filter((name): name is string => !!name);
            
        if (course && instructorNames.length > 0) {
            return { courseCode: course.code, instructorNames };
        }
        return null;
    })
    .filter((item): item is { courseCode: string; instructorNames: string[]; } => item !== null);


  const prompt = `
    You are an expert university timetable scheduler. Your task is to create a conflict-free weekly class schedule based on the provided data and rules.

    Available Data:
    1.  Courses (with total weekly hours and level): ${JSON.stringify(courses.map(({id, ...c}) => c), null, 2)}
    2.  Instructors (with max weekly teaching hours and two-days-only property): ${JSON.stringify(instructors.map(({id, ...i}) => i), null, 2)}
    3.  Lecture Rooms: ${JSON.stringify(rooms.map(({id, ...r}) => r), null, 2)}
    4.  Available Weekdays: ${JSON.stringify(DAYS_OF_WEEK)}
    5.  Potential Instructor Assignments (for each course, only ONE instructor must be chosen from its available list): ${JSON.stringify(formattedAssignments, null, 2)}

    Strict Rules and Constraints to Follow:
    **Core Principle: One academic hour equals 50 actual minutes.** All duration calculations must be based on this principle.

    1.  **Lecture Splitting (General Rule):** Every course, except for specified special cases, must be scheduled as two sessions (lectures) per week.
    2.  **Session Duration and Timing Calculation:**
        *   **Splitting Weekly Hours:**
            *   **For courses with an even number of hours:** Split the hours equally between the two sessions. Example: A 4-hour course is split into two 2-hour (100-minute) sessions.
            *   **For courses with an odd number of hours:** Split the hours into two unequal sessions. The longer session is (ceiling of half the hours), and the shorter is (floor of half the hours). Example: A 5-hour course is split into one 3-hour (150-minute) session and one 2-hour (100-minute) session.
        *   **Start Times:** All sessions must start either on the hour (XX:00) or on the half-hour (XX:30).
        *   **Time Format:** The time format must be 'HH:MM - HH:MM'. The end time must be calculated precisely based on the start time and the duration in minutes.
            *   Example 1: A 100-minute session starting at 08:00 should be formatted as '08:00 - 09:40'.
            *   Example 2: A 150-minute session starting at 10:30 should be formatted as '10:30 - 13:00'.
            *   Example 3: A 50-minute (1 academic hour) session starting at 09:00 should be formatted as '09:00 - 09:50'.
        *   **Time Range:** Session start times must be between 8:00 AM and 6:00 PM (18:00).
        *   **Start Time Exception:** No lecture can start between 12:00 PM and 1:00 PM (13:00). This means start times of '12:00' and '12:30' are forbidden. A lecture can end during this period, but it cannot begin.
    3.  **Day Distribution and Time Unification (General Rule):**
        *   The two sessions for the same course (excluding special cases) must be on non-consecutive days, and only within one of the following pairs: (Sunday and Tuesday) or (Monday and Wednesday).
        *   **Strong Preference for Unified Times:** Every effort must be made to make the start times for both sessions of the same course identical. For example, if a course session is at 10:00 on Sunday, its second session on Tuesday should also start at 10:00. Times should only be varied as a last resort to resolve an unavoidable conflict.
    4.  **Instructor Assignment:**
        *   **For Assigned Courses:** If a list of potential instructors is specified for a course in the 'Potential Instructor Assignments' list, you must choose only ONE of those instructors to teach all sessions of that course.
        *   **For Unassigned Courses:** If a course (from the list of courses to be scheduled) is not mentioned in the 'Potential Instructor Assignments' list, you can assign any instructor from the general faculty list to teach it, provided all other constraints (like instructor workload) are met.
    5.  **Instructor Workday Constraints:** If an instructor has the 'twoDaysOnly' flag set to 'true', all their scheduled sessions must fall within a single day pair. That is, all their lectures are either on (Sunday and Tuesday) or on (Monday and Wednesday), and cannot be spread across more than one pair (e.g., they cannot have a lecture on Sunday and another on Wednesday).
    6.  **No Instructor Conflicts:** The same instructor cannot be assigned to two different places at the same time on the same day.
    7.  **No Room Conflicts:** The same room cannot be used for two different sessions at the same time on the same day.
    8.  **No Same-Level Course Conflicts:** Two different courses from the same academic level (e.g., two 200-level courses) cannot be scheduled at the same time on the same day.
    9.  **Minimize Gaps for Instructors:** Whenever possible, try to schedule an instructor's lectures back-to-back on the same day to minimize time gaps between them. This is a strong preference.
    10. **Workload Management:** It is strongly preferred that the total scheduled hours for each instructor do not exceed their 'maxHours' limit. However, if it's impossible to create a complete schedule without exceeding this limit, a slight overage is permissible as a last resort to ensure all required courses are scheduled.
    11. **Complete Coverage:** All courses from the list must be scheduled.
    12. **Use Only Provided Data:** Use only the specified instructors, rooms, and days.
    13. **Special Rules for Engineering Drawing Sections (MEN 100-1 & MEN 100-2):**
        *   **Splitting:** Each of the two courses, 'MEN 100-1' and 'MEN 100-2' (6 hours each), must be split into three identical sessions, each lasting 2 hours (100 minutes).
        *   **Days:** These three sessions for each section must be on the following days: Sunday, Tuesday, and Thursday.
        *   **Fixed and Strict Timings:**
            *   All three sessions for 'MEN 100-1' must be in the time slot '10:00 - 11:40' on their respective three days.
            *   All three sessions for 'MEN 100-2' must be in the time slot '13:00 - 14:40' on their respective three days.
        *   **Exclusive Room:** All sessions for 'MEN 100-1' and 'MEN 100-2' must be scheduled exclusively in 'R02 Lab'. This room cannot be used for any other course.
    14. **Specific Work Days for Instructors:** As a general rule, the lectures for the following instructors must be scheduled exclusively on their assigned days. This rule applies to all their courses **except** for courses that have their own specific day rules (like MEN 100-1 & MEN 100-2 for instructor Albaraa Ghabban).
        *   Albaraa Ghabban: Sunday and Tuesday.
        *   Alaa Alaidroos: Monday and Wednesday.
        *   Mohammed Fageha: Sunday and Tuesday.
        *   Faisal Alhassani: Monday and Wednesday.
    15. **Specific Start Times for Instructors:** All lectures for instructors 'Mohammed Fageha' and 'Alaa Alaidroos' must start at 10:00 AM or later. No lecture can be scheduled for them before this time.
    16. **Fixed Schedule for Computer Applications in Building Design (AREN 200):**
        *   **Rule:** This 5-hour course must be strictly and fixedly scheduled at the following times and days:
        *   **First Session (3 hours):** Sunday, time slot '15:00 - 17:30'.
        *   **Second Session (2 hours):** Tuesday, time slot '15:00 - 16:40'.
        *   This rule has priority over any other rules or preferences that might conflict with it.
    17. **Fixed Start Time for HVAC Systems Design (AREN 351):** All sessions for this course must start at exactly 11:00 AM.
    18. **Fixed Days for HVAC Systems Design (AREN 351):** All sessions for this course must be scheduled exclusively on Sunday and Tuesday. This rule has priority and overrides the specific work day rule for instructor Alaa Alaidroos.
    19. **Start Time for AREN Courses:** All lectures for courses whose code starts with 'AREN' must begin at 10:00 AM or later. This rule has priority over other general preferences.

    Output Format:
    You must return the schedule data as a valid JSON array only. Do not include any other text, explanations, or markdown formatting. The array should contain objects, where each object represents a **single session** with the following structure:
    { "courseCode": "Course Code", "instructorName": "Instructor Name", "roomName": "Room Name", "day": "Day", "timeSlot": "Time Slot" }
    
    Example: A 5-hour 'AREN 200' course will appear as two objects in the array, one for the 3-hour session (e.g., '08:00 - 10:30') and another for the 2-hour session (e.g., '08:00 - 09:40').
    Example 2: A 6-hour 'MEN 100-1' course will appear as three separate objects in the array, one for Sunday, one for Tuesday, and one for Thursday, each with the time slot '10:00 - 11:40'.

    If it's impossible to create a valid schedule that satisfies all constraints, return an empty JSON array: [].
  `;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    const textResponse = response.text.trim();
    if (!textResponse) {
        console.error("Gemini returned an empty response.");
        return [];
    }
    
    return JSON.parse(textResponse);
  } catch (error) {
    console.error("Error generating timetable with Gemini:", error);
    throw new Error("Failed to generate timetable.");
  }
};