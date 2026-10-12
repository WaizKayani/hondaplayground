import { DEFAULT_PROJECTS } from "../data/projects";
import { DEFAULT_STUDENTS } from "../data/students";

const KEYS = {
  projects: "honda-osu-projects",
  students: "honda-osu-students",
  selectedStudentId: "honda-osu-selected-student",
  applications: "honda-osu-applications",
};

function safeParse(value, fallback) {
  try {
    if (value === null || value === undefined) {
      return fallback;
    }
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function getProjects() {
  if (!isBrowser()) return [...DEFAULT_PROJECTS];
  const stored = localStorage.getItem(KEYS.projects);
  if (stored === null) {
    localStorage.setItem(KEYS.projects, JSON.stringify(DEFAULT_PROJECTS));
    return [...DEFAULT_PROJECTS];
  }
  return safeParse(stored, [...DEFAULT_PROJECTS]);
}

export function saveProjects(projects) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.projects, JSON.stringify(projects));
}

export function getStudents() {
  if (!isBrowser()) return [...DEFAULT_STUDENTS];
  const stored = localStorage.getItem(KEYS.students);
  if (stored === null) {
    localStorage.setItem(KEYS.students, JSON.stringify(DEFAULT_STUDENTS));
    return [...DEFAULT_STUDENTS];
  }
  return safeParse(stored, [...DEFAULT_STUDENTS]);
}

export function saveStudents(students) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.students, JSON.stringify(students));
}

export function getSelectedStudentId() {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEYS.selectedStudentId);
}

export function saveSelectedStudentId(studentId) {
  if (!isBrowser()) return;
  if (studentId === null || studentId === undefined) {
    localStorage.removeItem(KEYS.selectedStudentId);
  } else {
    localStorage.setItem(KEYS.selectedStudentId, studentId);
  }
}

export function getApplications() {
  if (!isBrowser()) return [];
  const stored = localStorage.getItem(KEYS.applications);
  if (stored === null) {
    localStorage.setItem(KEYS.applications, JSON.stringify([]));
    return [];
  }
  return safeParse(stored, []);
}

export function saveApplications(applications) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.applications, JSON.stringify(applications));
}

export function resetDemoData() {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.projects, JSON.stringify(DEFAULT_PROJECTS));
  localStorage.setItem(KEYS.students, JSON.stringify(DEFAULT_STUDENTS));
  localStorage.setItem(KEYS.applications, JSON.stringify([]));
  localStorage.removeItem(KEYS.selectedStudentId);
}

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getAvailablePositions(project, applications) {
  const acceptedCount = applications.filter(
    (app) => app.projectId === project.id && app.status === "Accepted"
  ).length;
  return Math.max(0, project.positions - acceptedCount);
}
