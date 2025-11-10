



import React, { useState, useCallback, useMemo, FC } from 'react';
import { Course, Instructor, Room, ScheduleEntry } from './types';
import { DAYS_OF_WEEK } from './constants';
import { generateTimetable } from './services/geminiService';
import { PlusIcon, TrashIcon, SparklesIcon, DownloadIcon } from './components/icons';

// --- Helper Functions ---
const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const parseTime = (timeStr: string): number => {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

const initialCourses: Course[] = [
    // New Course Sections
    { id: generateId(), name: 'Engineering Drawing (Sec 1)', code: 'MEN 100-1', hours: 6, category: 'compulsory', level: 100 },
    { id: generateId(), name: 'Engineering Drawing (Sec 2)', code: 'MEN 100-2', hours: 6, category: 'compulsory', level: 100 },
    // Compulsory
    { id: generateId(), name: 'Computer Applications in Building Design', code: 'AREN 200', hours: 5, category: 'compulsory', level: 200 },
    { id: generateId(), name: 'Numerical Methods for Architectural Engineering', code: 'AREN 211', hours: 5, category: 'compulsory', level: 200 },
    { id: generateId(), name: 'Introduction to Architectural Design Fundamentals', code: 'AREN 220', hours: 6, category: 'compulsory', level: 200 },
    { id: generateId(), name: 'Thermal Analysis of Buildings', code: 'AREN 250', hours: 4, category: 'compulsory', level: 200 },
    { id: generateId(), name: 'Architectural Design Studio (1)', code: 'AREN 321', hours: 6, category: 'compulsory', level: 300 },
    { id: generateId(), name: 'Architectural Design Studio (2)', code: 'AREN 322', hours: 6, category: 'compulsory', level: 300 },
    { id: generateId(), name: 'Building Construction Systems and Materials', code: 'AREN 332', hours: 4, category: 'compulsory', level: 300 },
    { id: generateId(), name: 'Working Drawings', code: 'AREN 333', hours: 5, category: 'compulsory', level: 300 },
    { id: generateId(), name: 'Electromechanical Systems for Buildings', code: 'AREN 350', hours: 5, category: 'compulsory', level: 300 },
    { id: generateId(), name: 'HVAC Systems Design', code: 'AREN 351', hours: 3, category: 'compulsory', level: 300 },
    { id: generateId(), name: 'Lighting and Acoustics Systems for Buildings', code: 'AREN 360', hours: 5, category: 'compulsory', level: 300 },
    { id: generateId(), name: 'Job Market Skills in Architectural Engineering', code: 'AREN 391', hours: 4, category: 'compulsory', level: 300 },
    { id: generateId(), name: 'Summer Training', code: 'AREN 392', hours: 8, category: 'compulsory', level: 300 },
    { id: generateId(), name: 'Construction Project Management', code: 'AREN 470', hours: 4, category: 'compulsory', level: 400 },
    { id: generateId(), name: 'Sustainable Building Design', code: 'AREN 480', hours: 4, category: 'compulsory', level: 400 },
    { id: generateId(), name: 'Graduation Project', code: 'AREN 499', hours: 8, category: 'compulsory', level: 400 },
    // Elective
    { id: generateId(), name: 'History and Theories of Architecture', code: 'AREN 410', hours: 3, category: 'elective', level: 400 },
    { id: generateId(), name: 'Advanced Numerical Modeling for Building Systems', code: 'AREN 412', hours: 4, category: 'elective', level: 400 },
    { id: generateId(), name: 'Advanced Architectural Design Studio', code: 'AREN 423', hours: 6, category: 'elective', level: 400 },
    { id: generateId(), name: 'Building Energy Modeling and Simulation', code: 'AREN 450', hours: 4, category: 'elective', level: 400 },
    { id: generateId(), name: 'Energy Auditing and Building Retrofitting', code: 'AREN 451', hours: 4, category: 'elective', level: 400 },
    { id: generateId(), name: 'Modeling and Control of HVAC Systems', code: 'AREN 452', hours: 4, category: 'elective', level: 400 },
    { id: generateId(), name: 'Computational Fluid Dynamics for Building Environment', code: 'AREN 453', hours: 4, category: 'elective', level: 400 },
    { id: generateId(), name: 'Daylight Design', code: 'AREN 461', hours: 4, category: 'elective', level: 400 },
    { id: generateId(), name: 'Control Systems and Building Automation', code: 'AREN 462', hours: 4, category: 'elective', level: 400 },
    { id: generateId(), name: 'Contracts, Standards, and Specifications for Buildings', code: 'AREN 471', hours: 4, category: 'elective', level: 400 },
    { id: generateId(), name: 'Construction Cost Estimating', code: 'AREN 472', hours: 4, category: 'elective', level: 400 },
    { id: generateId(), name: 'Construction Project Scheduling', code: 'AREN 473', hours: 4, category: 'elective', level: 400 },
    { id: generateId(), name: 'Green Building Assessment Systems', code: 'AREN 481', hours: 3, category: 'elective', level: 400 },
    { id: generateId(), name: 'Building Performance Analysis', code: 'AREN 482', hours: 4, category: 'elective', level: 400 },
    { id: generateId(), name: 'Building Life Cycle Assessment', code: 'AREN 483', hours: 3, category: 'elective', level: 400 },
    { id: generateId(), name: 'BIM Applications in Building Construction', code: 'AREN 484', hours: 4, category: 'elective', level: 400 },
    { id: generateId(), name: 'Renewable Energy Applications in Buildings', code: 'AREN 485', hours: 4, category: 'elective', level: 400 },
    { id: generateId(), name: 'Special Topics in Architectural Engineering (1)', code: 'AREN 491', hours: 3, category: 'elective', level: 400 },
    { id: generateId(), name: 'Special Topics in Architectural Engineering (2)', code: 'AREN 492', hours: 3, category: 'elective', level: 400 },
];


const initialInstructors: Instructor[] = [
    { id: generateId(), name: 'Alaa Alaidroos', maxHours: 3, twoDaysOnly: false },
    { id: generateId(), name: 'Mohammed Fageha', maxHours: 14, twoDaysOnly: false },
    { id: generateId(), name: 'Faisal Alhassani', maxHours: 16, twoDaysOnly: false },
    { id: generateId(), name: 'Albaraa Ghabban', maxHours: 16, twoDaysOnly: false },
];

const initialRooms: Room[] = [
    { id: generateId(), name: 'Room 208', capacity: 20 },
    { id: generateId(), name: 'Room 209', capacity: 20 },
    { id: generateId(), name: 'R02 Lab', capacity: 25 },
];

const createInitialAssignments = (courses: Course[], instructors: Instructor[]): Record<string, string[]> => {
    const assignments = [
        // Albaraa Ghabban
        { courseCode: 'MEN 100-1', instructorNames: ['Albaraa Ghabban'] },
        { courseCode: 'MEN 100-2', instructorNames: ['Albaraa Ghabban'] },
        { courseCode: 'AREN 200', instructorNames: ['Albaraa Ghabban'] },
        // Mohammed Fageha
        { courseCode: 'AREN 423', instructorNames: ['Mohammed Fageha'] },
        { courseCode: 'AREN 332', instructorNames: ['Mohammed Fageha'] },
        { courseCode: 'AREN 480', instructorNames: ['Mohammed Fageha'] },
        // Faisal Alhassani
        { courseCode: 'AREN 322', instructorNames: ['Faisal Alhassani'] },
        { courseCode: 'AREN 333', instructorNames: ['Faisal Alhassani'] },
        { courseCode: 'AREN 360', instructorNames: ['Faisal Alhassani'] },
        // Alaa Alaidroos
        { courseCode: 'AREN 351', instructorNames: ['Alaa Alaidroos'] },
    ];

    const map: Record<string, string[]> = {};

    for (const assignment of assignments) {
        const course = courses.find(c => c.code === assignment.courseCode);
        if (!course) {
            console.warn(`Initial assignment failed: Course with code ${assignment.courseCode} not found.`);
            continue;
        }

        const instructorIds = assignment.instructorNames.map(name => {
            const instructor = instructors.find(i => i.name === name);
            if (!instructor) {
                 console.warn(`Initial assignment failed: Instructor with name ${name} not found for course ${assignment.courseCode}.`);
            }
            return instructor?.id;
        }).filter((id): id is string => !!id);
        
        if (instructorIds.length > 0) {
            map[course.id] = instructorIds;
        }
    }
    return map;
};

// --- Sub-components defined outside App to prevent re-creation on re-render ---

interface DataCardProps<T> {
  title: string;
  items: T[];
  onAddItem: (item: Omit<T, 'id'>) => void;
  onDeleteItem: (id: string) => void;
  renderItem: (item: T) => React.ReactNode;
  formFields: { 
      name: keyof Omit<T, 'id'>; 
      label: string; 
      type: string; 
      options?: {value: string | number; label: string}[];
  }[];
}

const DataCard = <T extends { id: string }>({ items, onAddItem, onDeleteItem, renderItem, formFields }: DataCardProps<T>) => {
    const [newItem, setNewItem] = useState<Omit<T, 'id'>>(() => {
        const initialState: any = {};
        formFields.forEach(field => {
            initialState[field.name] = field.type === 'number' ? 0 : (field.type === 'checkbox' ? false : (field.type === 'select' ? field.options?.[0]?.value ?? '' : ''));
        });
        return initialState;
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = isCheckbox ? (e.target as HTMLInputElement).checked : false;

        const fieldDef = formFields.find(f => f.name === name);
        const finalValue = isCheckbox ? checked : (fieldDef?.type === 'number' ? (parseInt(value, 10) || 0) : value);

        setNewItem(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddItem(newItem);
        const resetState: any = {};
        formFields.forEach(field => {
             resetState[field.name] = field.type === 'number' ? 0 : (field.type === 'checkbox' ? false : (field.type === 'select' ? field.options?.[0]?.value ?? '' : ''));
        });
        setNewItem(resetState);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 h-full flex flex-col rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-3 mb-4">
                 <div className="grid grid-cols-2 gap-3">
                    {formFields.filter(f => f.type !== 'checkbox').map(field => {
                        const commonProps = {
                             key: field.name as string,
                             name: field.name as string,
                             value: (newItem as any)[field.name],
                             onChange: handleInputChange,
                             className:"col-span-1 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500",
                             required: true
                        };
                        if (field.type === 'select') {
                            return <select {...commonProps}>{field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>
                        }
                        return <input {...commonProps} type={field.type} placeholder={field.label}/>;
                    })}
                </div>
                {formFields.filter(f => f.type === 'checkbox').map(field => (
                     <label key={field.name as string} className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-slate-900 dark:text-slate-300">
                        <input type="checkbox" name={field.name as string} checked={(newItem as any)[field.name] || false} onChange={handleInputChange} className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"/>
                        <span>{field.label}</span>
                    </label>
                ))}
                <button type="submit" className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full px-5 py-2.5 text-center dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 flex items-center justify-center gap-2">
                    <PlusIcon /> Add
                </button>
            </form>
            <div className="flex-grow overflow-y-auto space-y-2 pr-2 -mr-2">
                {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md">
                        {renderItem(item)}
                        <button onClick={() => onDeleteItem(item.id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded-full flex-shrink-0">
                            <TrashIcon />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main App Component ---

const App: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>(initialCourses);
    const [instructors, setInstructors] = useState<Instructor[]>(initialInstructors);
    const [rooms, setRooms] = useState<Room[]>(initialRooms);
    const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
    const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
    const [courseInstructorMap, setCourseInstructorMap] = useState<Record<string, string[]>>(() => createInitialAssignments(initialCourses, initialInstructors));
    const [openCourseDropdown, setOpenCourseDropdown] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('courses');
    
    const [isLoading, setIsLoading] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    
    const handleAddItem = <T extends { id: string }>(
        setter: React.Dispatch<React.SetStateAction<T[]>>,
        item: Omit<T, 'id'>
    ) => {
        setter(prev => [...prev, { ...item, id: generateId() } as T]);
    };

    const handleDeleteItem = <T extends { id: string }>(
        setter: React.Dispatch<React.SetStateAction<T[]>>,
        id: string,
        itemType: 'course' | 'instructor' | 'room'
    ) => {
        setter(prev => prev.filter(item => item.id !== id));
        if (itemType === 'course') {
            setSelectedCourseIds(prev => { const newSet = new Set(prev); newSet.delete(id); return newSet; });
            setCourseInstructorMap(prev => { const newMap = { ...prev }; delete newMap[id]; return newMap; });
        }
        if (itemType === 'instructor') {
             setCourseInstructorMap(prev => {
                const newMap = { ...prev };
                Object.keys(newMap).forEach(courseId => {
                    newMap[courseId] = newMap[courseId].filter(instId => instId !== id);
                    if (newMap[courseId].length === 0) delete newMap[courseId];
                });
                return newMap;
            });
        }
    };
    
    const handleCourseSelectionChange = (courseId: string) => {
        setSelectedCourseIds(prev => {
            const newSet = new Set(prev);
            newSet.has(courseId) ? newSet.delete(courseId) : newSet.add(courseId);
            return newSet;
        });
    };

    const handleInstructorAssignmentChange = (courseId: string, instructorId: string) => {
        setCourseInstructorMap(prev => {
            const current = prev[courseId] || [];
            const newInstructors = current.includes(instructorId) ? current.filter(id => id !== instructorId) : [...current, instructorId];
            const newMap = { ...prev };
            newInstructors.length > 0 ? (newMap[courseId] = newInstructors) : delete newMap[courseId];
            return newMap;
        });
    };

    const handleInstructorTwoDaysToggle = (instructorId: string, checked: boolean) => {
        setInstructors(prev => prev.map(inst => inst.id === instructorId ? { ...inst, twoDaysOnly: checked } : inst));
    };

    const handleSelectAll = () => setSelectedCourseIds(new Set(courses.map(c => c.id)));
    const handleDeselectAll = () => setSelectedCourseIds(new Set());

    const handleAutoGenerate = useCallback(async () => {
        setIsLoading(true);
        setGenerationError(null);

        const selectedCourses = courses.filter(c => selectedCourseIds.has(c.id));
        if (selectedCourses.length === 0) {
            setGenerationError("Please select at least one course to generate the timetable.");
            setIsLoading(false);
            return;
        }

        const assignmentsForSelectedCourses: Record<string, string[]> = {};
        selectedCourseIds.forEach(courseId => {
            if (courseInstructorMap[courseId] && courseInstructorMap[courseId].length > 0) {
                assignmentsForSelectedCourses[courseId] = courseInstructorMap[courseId];
            }
        });

        try {
            const generatedData = await generateTimetable(selectedCourses, instructors, rooms, assignmentsForSelectedCourses);
            if(generatedData.length === 0){
                setGenerationError("The AI could not generate a valid timetable. Try modifying constraints or adding more resources.");
                setSchedule([]);
                return;
            }
            const newSchedule: ScheduleEntry[] = generatedData.map((item: any) => {
                const course = courses.find(c => c.code === item.courseCode);
                const instructor = instructors.find(i => i.name === item.instructorName);
                const room = rooms.find(r => r.name === item.roomName);
                const [startTime, endTime] = (item.timeSlot || "").split(' - ').map((t:string) => t.trim());
                if (!course || !instructor || !room || !startTime || !endTime) return null;
                return { id: generateId(), courseId: course.id, instructorId: instructor.id, roomId: room.id, day: item.day, startTime, endTime };
            }).filter((item): item is ScheduleEntry => item !== null);
            setSchedule(newSchedule);
        } catch (err) {
            setGenerationError("An error occurred while generating the timetable. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [courses, instructors, rooms, selectedCourseIds, courseInstructorMap]);

    const exportToCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Day,Time,Course,Code,Instructor,Room\r\n";
        schedule.sort((a,b) => DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day) || a.startTime.localeCompare(b.startTime))
        .forEach(entry => {
            const course = courses.find(c => c.id === entry.courseId);
            const instructor = instructors.find(i => i.id === entry.instructorId);
            const room = rooms.find(r => r.id === entry.roomId);
            const row = [ entry.day, `"${entry.startTime} - ${entry.endTime}"`, `"${course?.name.replace(/"/g, '""')}"`, course?.code, instructor?.name, room?.name ].join(",");
            csvContent += row + "\r\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "timetable.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Fix: Replaced `Array.from` with the spread syntax to correctly infer the array type.
    // `Array.from(new Set(...))` was inferred as `unknown[]`, causing a type error.
    // The spread syntax ensures `levels` is correctly typed as `number[]`.
    const levels: number[] = [...new Set(courses.map(c => c.level))].sort((a,b) => a - b);
    
    const INSTRUCTOR_COLORS = useMemo(() => [
        { border: 'border-violet-500', bg: 'bg-violet-50', text: 'text-violet-800', darkBg: 'dark:bg-violet-900/40', darkText: 'dark:text-violet-200' },
        { border: 'border-sky-500', bg: 'bg-sky-50', text: 'text-sky-800', darkBg: 'dark:bg-sky-900/40', darkText: 'dark:text-sky-200' },
        { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-800', darkBg: 'dark:bg-amber-900/40', darkText: 'dark:text-amber-200' },
        { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800', darkBg: 'dark:bg-emerald-900/40', darkText: 'dark:text-emerald-200' },
        { border: 'border-rose-500', bg: 'bg-rose-50', text: 'text-rose-800', darkBg: 'dark:bg-rose-900/40', darkText: 'dark:text-rose-200' },
    ], []);

    const getInstructorColor = useCallback((instructorId: string) => {
        const sortedInstructors = [...instructors].sort((a, b) => a.name.localeCompare(b.name));
        const index = sortedInstructors.findIndex(i => i.id === instructorId);
        return INSTRUCTOR_COLORS[index % INSTRUCTOR_COLORS.length] || INSTRUCTOR_COLORS[4];
    }, [instructors, INSTRUCTOR_COLORS]);

    const processedSchedule = useMemo(() => {
        const scheduleWithTimes = schedule.map(entry => ({
            ...entry,
            startMinutes: parseTime(entry.startTime),
            endMinutes: parseTime(entry.endTime),
        }));

        const finalSchedule: (ScheduleEntry & { startMinutes: number; endMinutes: number; layout: { height: number; top: number } })[] = [];

        for (const day of DAYS_OF_WEEK) {
            const dayEvents = scheduleWithTimes
                .filter(e => e.day === day)
                .sort((a, b) => a.startMinutes - b.startMinutes || (b.endMinutes - b.startMinutes) - (a.endMinutes - a.startMinutes));
            
            if (dayEvents.length === 0) continue;

            const collisionGroups: (typeof dayEvents)[] = [];
            let currentGroup = [dayEvents[0]];
            for (let i = 1; i < dayEvents.length; i++) {
                const event = dayEvents[i];
                const groupEndTime = Math.max(...currentGroup.map(e => e.endMinutes));
                if (event.startMinutes < groupEndTime) {
                    currentGroup.push(event);
                } else {
                    collisionGroups.push(currentGroup);
                    currentGroup = [event];
                }
            }
            collisionGroups.push(currentGroup);

            for (const group of collisionGroups) {
                const verticalLanes: (typeof group)[] = [];
                group.sort((a, b) => a.startMinutes - b.startMinutes);
                for (const event of group) {
                    let placed = false;
                    for (let i = 0; i < verticalLanes.length; i++) {
                        if (verticalLanes[i][verticalLanes[i].length - 1].endMinutes <= event.startMinutes) {
                            verticalLanes[i].push(event);
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) {
                        verticalLanes.push([event]);
                    }
                }
                const numLanes = verticalLanes.length;
                for (let i = 0; i < verticalLanes.length; i++) {
                    for (const event of verticalLanes[i]) {
                        finalSchedule.push({
                            ...event,
                            layout: {
                                height: 100 / numLanes,
                                top: (i * 100) / numLanes,
                            },
                        });
                    }
                }
            }
        }
        return finalSchedule;
    }, [schedule]);

    type ProcessedScheduleEntry = ScheduleEntry & { startMinutes: number; endMinutes: number; layout: { height: number; top: number } };

    const TimetableGrid: FC<{
        entries: ProcessedScheduleEntry[];
        title?: React.ReactNode;
        subtitle?: React.ReactNode;
    }> = ({ entries, title, subtitle }) => {
        const timeLabels = [];
        for (let h = 8; h < 18; h++) {
            timeLabels.push(`${String(h).padStart(2, '0')}:00`);
        }
        const TOTAL_MINUTES = (18 - 8) * 60;

        return (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 sm:p-6 overflow-x-auto">
                {title && <h3 className="text-xl font-bold mb-1 text-slate-800 dark:text-slate-100">{title}</h3>}
                {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{subtitle}</p>}
                
                <div className="grid grid-cols-[auto,1fr] gap-y-2" style={{ minWidth: '900px' }}>
                    {/* Time Header */}
                    <div className="col-start-2 grid grid-cols-10">
                        {timeLabels.map(time => (
                            <div key={time} className="text-center text-xs font-mono text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 pb-2">
                                {time}
                            </div>
                        ))}
                    </div>

                    {/* Day Rows */}
                    {DAYS_OF_WEEK.map(day => {
                        const dayEntries = entries.filter(e => e.day === day);
                        const dayHeightClass = (day === "Sunday" || day === "Tuesday")
                            ? "min-h-[18rem]" // Increased height for busy days
                            : "min-h-[10rem]"; // Standard height
                        return (
                            <React.Fragment key={day}>
                                <div className="pr-4 text-right font-semibold text-sm text-slate-600 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-800 flex items-center justify-end">
                                    <span>{day}</span>
                                </div>
                                <div className="relative border-t border-slate-200 dark:border-slate-700">
                                    {/* Vertical Grid Lines */}
                                    <div className="absolute inset-0 grid grid-cols-10">
                                        {timeLabels.map((_, index) => (
                                            <div key={index} className="h-full border-r border-dashed border-slate-200 dark:border-slate-700"></div>
                                        ))}
                                    </div>
                                    
                                    {/* Events for the day */}
                                    <div className={`relative ${dayHeightClass} py-2`}>
                                        {dayEntries.map(entry => {
                                            const left = ((entry.startMinutes - 8 * 60) / TOTAL_MINUTES) * 100;
                                            const width = ((entry.endMinutes - entry.startMinutes) / TOTAL_MINUTES) * 100;
                                            if (width <= 0) return null;

                                            const color = getInstructorColor(entry.instructorId);
                                            const course = courses.find(c => c.id === entry.courseId);
                                            const room = rooms.find(r => r.id === entry.roomId);

                                            return (
                                                <div
                                                    key={entry.id}
                                                    className={`absolute flex flex-col p-2 rounded-lg shadow-md overflow-hidden transition-all duration-200 ease-in-out border-l-4 ${color.border} ${color.bg} ${color.text} ${color.darkBg} ${color.darkText}`}
                                                    style={{
                                                        left: `calc(${left}% + 1px)`,
                                                        width: `calc(${width}% - 2px)`,
                                                        top: `calc(${entry.layout.top}% + 1px)`,
                                                        height: `calc(${entry.layout.height}% - 2px)`,
                                                    }}
                                                    title={`${course?.name}\n${entry.startTime} - ${entry.endTime}\n${room?.name}`}
                                                >
                                                    <p className="font-bold text-xs truncate">{course?.name}</p>
                                                    <p className="text-[11px] opacity-80 truncate">{course?.code}</p>
                                                    <p className="text-[11px] opacity-70 mt-auto truncate">{room?.name}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-slate-800 dark:text-slate-200 p-4" onClick={() => openCourseDropdown && setOpenCourseDropdown(null)}>
            <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Sidebar for Controls */}
                <aside className="lg:col-span-4 xl:col-span-3 sticky top-6 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
                        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Timetable Generator</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage data and generate schedules.</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <div className="border-b border-slate-200 dark:border-slate-700">
                            <nav className="flex -mb-px">
                                <button onClick={() => setActiveTab('courses')} className={`flex-1 py-3 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'courses' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Courses</button>
                                <button onClick={() => setActiveTab('instructors')} className={`flex-1 py-3 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'instructors' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Instructors</button>
                                <button onClick={() => setActiveTab('rooms')} className={`flex-1 py-3 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'rooms' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Rooms</button>
                            </nav>
                        </div>
                        <div className="p-4" style={{maxHeight: 'calc(100vh - 200px)', overflowY: 'auto'}}>
                            {activeTab === 'courses' && <DataCard<Course> title="Manage Courses" items={courses} onAddItem={(item) => handleAddItem(setCourses, item)} onDeleteItem={(id) => handleDeleteItem(setCourses, id, 'course')}
                                renderItem={(item) => (<div className="flex-grow flex items-center justify-between gap-2" onClick={e=>e.stopPropagation()}><span className="text-sm font-medium whitespace-nowrap">{item.name} ({item.code})</span><div className="relative">
                                    <button type="button" onClick={() => setOpenCourseDropdown(openCourseDropdown === item.id ? null : item.id)} className="w-40 text-sm text-slate-900 border border-slate-300 rounded-lg bg-slate-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white p-1 text-left truncate pl-2">{(courseInstructorMap[item.id] || []).map(id => instructors.find(i => i.id === id)?.name).filter(Boolean).join(', ') || 'Assign'}</button>
                                    {openCourseDropdown === item.id && (<div className="absolute z-20 w-48 mt-1 bg-white dark:bg-slate-800 rounded-md shadow-lg border dark:border-slate-600 max-h-40 overflow-y-auto">{instructors.map(instructor => (
                                        <label key={instructor.id} className="flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"><input type="checkbox" checked={(courseInstructorMap[item.id] || []).includes(instructor.id)} onChange={() => handleInstructorAssignmentChange(item.id, instructor.id)} className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500" /><span className="text-sm font-medium text-slate-900 dark:text-slate-300">{instructor.name}</span></label>
                                    ))}</div>)}</div></div>)}
                                formFields={[{ name: 'name', label: 'Course Name', type: 'text' }, { name: 'code', label: 'Course Code', type: 'text' }, { name: 'hours', label: 'Hours', type: 'number' }, { name: 'category', label: 'Category', type: 'select', options: [{value: 'compulsory', label: 'Compulsory'}, {value: 'elective', label: 'Elective'}]}, { name: 'level', label: 'Level', type: 'select', options: levels.map(l => ({value: l, label: l.toString()}))}]}
                            />}
                            {activeTab === 'instructors' && <DataCard<Instructor> title="Manage Instructors" items={instructors} onAddItem={(item) => handleAddItem(setInstructors, item)} onDeleteItem={(id) => handleDeleteItem(setInstructors, id, 'instructor')}
                                renderItem={(item) => (<div className="flex-grow flex items-center justify-between w-full"><span className="text-sm font-medium">{item.name} - {item.maxHours} hrs</span><label className="flex items-center space-x-2 cursor-pointer text-sm"><input type="checkbox" checked={item.twoDaysOnly} onChange={(e) => handleInstructorTwoDaysToggle(item.id, e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" /><span>Paired Days</span></label></div>)}
                                formFields={[{ name: 'name', label: 'Instructor Name', type: 'text' }, { name: 'maxHours', label: 'Max Hours', type: 'number' }, { name: 'twoDaysOnly', label: 'Works on paired days', type: 'checkbox'}]}
                            />}
                            {activeTab === 'rooms' && <DataCard<Room> title="Manage Lecture Halls" items={rooms} onAddItem={(item) => handleAddItem(setRooms, item)} onDeleteItem={(id) => handleDeleteItem(setRooms, id, 'room')} renderItem={(item) => <span className="text-sm font-medium">{item.name} - Cap: {item.capacity}</span>} formFields={[{ name: 'name', label: 'Room Name', type: 'text' }, { name: 'capacity', label: 'Capacity', type: 'number' }]}/>}
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="lg:col-span-8 xl:col-span-9 space-y-6">
                    <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 sm:p-6">
                        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">1. Select Courses for Semester</h2>
                        <div className="flex flex-wrap gap-3 mb-4">
                            <button onClick={handleSelectAll} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Select All</button>
                            <button onClick={handleDeselectAll} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">Deselect All</button>
                        </div>
                        <div className="max-h-80 overflow-y-auto p-1 space-y-4">
                            {levels.map(level => {
                                const levelCourses = courses.filter(c => c.level === level);
                                if (levelCourses.length === 0) return null;
                                return (<div key={level}><h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Level {level}</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">{levelCourses.map(course => (
                                    <label key={course.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50"><input type="checkbox" checked={selectedCourseIds.has(course.id)} onChange={() => handleCourseSelectionChange(course.id)} className="w-5 h-5 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500" /><span className="text-sm font-medium text-slate-700 dark:text-slate-300">{course.name} ({course.code})</span></label>
                                ))}</div></div>);
                            })}
                        </div>
                    </section>
                    
                    <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 sm:p-6">
                         <h2 className="text-xl font-semibold mb-2 text-slate-800 dark:text-white">2. Generate Schedule</h2>
                         <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Click the button for the AI to generate a timetable that respects all constraints.</p>
                        <button onClick={handleAutoGenerate} disabled={isLoading || selectedCourseIds.size === 0} className="text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-base px-5 py-3 text-center w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? (<><svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generating...</>) : (<><SparklesIcon /> Auto-Generate Timetable</>)}
                        </button>
                        {generationError && <p className="text-red-500 text-sm mt-2 text-center">{generationError}</p>}
                    </section>
                
                    <section>
                         <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Master Timetable</h2>
                            <button onClick={exportToCSV} disabled={schedule.length === 0} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold py-2 px-4 rounded-lg inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><DownloadIcon /><span>Export CSV</span></button>
                        </div>
                        <TimetableGrid entries={processedSchedule} />
                    </section>
                
                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Individual Instructor Schedules</h2>
                        <div className="space-y-8">
                            {instructors.length > 0 ? (
                                instructors.map(instructor => {
                                    const instructorSchedule = processedSchedule.filter(e => e.instructorId === instructor.id);
                                    const totalMinutes = instructorSchedule.reduce((acc, entry) => acc + (entry.endMinutes - entry.startMinutes), 0);
                                    const assignedHours = totalMinutes / 50;
                                    return (
                                        <TimetableGrid 
                                            key={instructor.id}
                                            entries={instructorSchedule}
                                            title={instructor.name}
                                            subtitle={`Load: ${assignedHours.toFixed(1)} / ${instructor.maxHours} hrs`}
                                        />
                                    );
                                })
                            ) : (
                                <p className="text-center text-slate-500 dark:text-slate-400">No instructors to display.</p>
                            )}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Instructor Schedule Summary</h2>
                        <div className="space-y-6">
                            {instructors.map(instructor => {
                                const instructorEntries = schedule
                                    .filter(entry => entry.instructorId === instructor.id)
                                    .sort((a, b) => DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day) || a.startTime.localeCompare(b.startTime));

                                if (instructorEntries.length === 0) {
                                    return null;
                                }

                                return (
                                    <div key={instructor.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 sm:p-6">
                                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">{instructor.name}</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                                                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3">Course</th>
                                                        <th scope="col" className="px-6 py-3">Day</th>
                                                        <th scope="col" className="px-6 py-3">Time</th>
                                                        <th scope="col" className="px-6 py-3">Room</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {instructorEntries.map(entry => {
                                                        const course = courses.find(c => c.id === entry.courseId);
                                                        const room = rooms.find(r => r.id === entry.roomId);
                                                        return (
                                                            <tr key={entry.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap dark:text-white">
                                                                    {course?.name} ({course?.code})
                                                                </th>
                                                                <td className="px-6 py-4">{entry.day}</td>
                                                                <td className="px-6 py-4">{entry.startTime} - {entry.endTime}</td>
                                                                <td className="px-6 py-4">{room?.name}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default App;