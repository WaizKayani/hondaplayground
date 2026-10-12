"use client";

import { useEffect, useState } from "react";
import ProjectCard from "../../components/ProjectCard";
import { CATEGORIES } from "../../data/projects";
import { ACADEMIC_YEARS } from "../../data/students";
import {
  createId,
  getApplications,
  getAvailablePositions,
  getProjects,
  getSelectedStudentId,
  getStudents,
  saveApplications,
  saveSelectedStudentId,
  saveStudents,
} from "../../lib/storage";

const emptyProfile = {
  name: "",
  major: "",
  year: "Freshman",
  skillsText: "",
  interestsText: "",
  availability: "",
};

export default function StudentPage() {
  const [ready, setReady] = useState(false);
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [interestMessage, setInterestMessage] = useState("");
  const [message, setMessage] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [activeSection, setActiveSection] = useState("projects");

  useEffect(() => {
    const loadedProjects = getProjects();
    const loadedStudents = getStudents();
    const loadedApplications = getApplications();
    let selectedId = getSelectedStudentId();

    if (selectedId && !loadedStudents.some((s) => s.id === selectedId)) {
      selectedId = null;
      saveSelectedStudentId(null);
    }

    setProjects(loadedProjects);
    setStudents(loadedStudents);
    setApplications(loadedApplications);
    setSelectedStudentId(selectedId);
    setReady(true);
  }, []);

  const selectedStudent =
    students.find((student) => student.id === selectedStudentId) || null;

  function showNotice(text, type = "info") {
    setMessage({ text, type });
  }

  function handleSelectStudent(studentId) {
    setSelectedStudentId(studentId || null);
    saveSelectedStudentId(studentId || null);
    setEditingProfile(false);
    setCreatingProfile(false);
  }

  function toggleCategory(category) {
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        return current.filter((item) => item !== category);
      }
      return [...current, category];
    });
  }

  function clearFilters() {
    setSelectedCategories([]);
    setSearchText("");
  }

  function filteredProjects() {
    return projects.filter((project) => {
      const matchesCategory =
        selectedCategories.length === 0 ||
        project.categories.some((category) =>
          selectedCategories.includes(category)
        );
      const matchesSearch =
        searchText.trim() === "" ||
        project.title.toLowerCase().includes(searchText.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  function openProjectDetails(project) {
    setSelectedProject(project);
    setShowApplyForm(false);
    setInterestMessage("");
    setMessage(null);
    setActiveSection("projects");
  }

  function closeProjectDetails() {
    setSelectedProject(null);
    setShowApplyForm(false);
    setInterestMessage("");
  }

  function startApply() {
    if (!selectedStudent) {
      showNotice("Select a student profile before applying.", "error");
      return;
    }

    const available = getAvailablePositions(selectedProject, applications);
    if (selectedProject.status !== "open" || available <= 0) {
      showNotice("This project is full or closed.", "error");
      return;
    }

    const alreadyApplied = applications.some(
      (app) =>
        app.projectId === selectedProject.id &&
        app.studentId === selectedStudent.id
    );
    if (alreadyApplied) {
      showNotice("You already applied to this project.", "error");
      return;
    }

    setShowApplyForm(true);
  }

  function submitApplication(event) {
    event.preventDefault();
    if (!selectedStudent || !selectedProject) return;

    const alreadyApplied = applications.some(
      (app) =>
        app.projectId === selectedProject.id &&
        app.studentId === selectedStudent.id
    );
    if (alreadyApplied) {
      showNotice("You already applied to this project.", "error");
      return;
    }

    const available = getAvailablePositions(selectedProject, applications);
    if (selectedProject.status !== "open" || available <= 0) {
      showNotice("This project is full or closed.", "error");
      return;
    }

    if (!interestMessage.trim()) {
      showNotice("Please explain why you are interested.", "error");
      return;
    }

    const newApplication = {
      id: createId("app"),
      projectId: selectedProject.id,
      studentId: selectedStudent.id,
      message: interestMessage.trim(),
      status: "Pending",
      date: new Date().toISOString(),
    };

    const updated = [...applications, newApplication];
    setApplications(updated);
    saveApplications(updated);
    setShowApplyForm(false);
    setInterestMessage("");
    showNotice("Application submitted successfully.", "success");
  }

  function startEditProfile() {
    if (!selectedStudent) return;
    setCreatingProfile(false);
    setEditingProfile(true);
    setProfileForm({
      name: selectedStudent.name,
      major: selectedStudent.major,
      year: selectedStudent.year,
      skillsText: selectedStudent.skills.join(", "),
      interestsText: selectedStudent.interests.join(", "),
      availability: selectedStudent.availability,
    });
  }

  function startCreateProfile() {
    setEditingProfile(false);
    setCreatingProfile(true);
    setProfileForm(emptyProfile);
  }

  function parseList(text) {
    return text
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function saveProfile(event) {
    event.preventDefault();
    if (!profileForm.name.trim() || !profileForm.major.trim()) {
      showNotice("Name and major are required.", "error");
      return;
    }

    const profileData = {
      name: profileForm.name.trim(),
      major: profileForm.major.trim(),
      year: profileForm.year,
      skills: parseList(profileForm.skillsText),
      interests: parseList(profileForm.interestsText),
      availability: profileForm.availability.trim() || "Not specified",
    };

    let updatedStudents;
    let newSelectedId = selectedStudentId;

    if (creatingProfile) {
      const newStudent = {
        id: createId("stu"),
        ...profileData,
      };
      updatedStudents = [...students, newStudent];
      newSelectedId = newStudent.id;
    } else {
      updatedStudents = students.map((student) =>
        student.id === selectedStudentId
          ? { ...student, ...profileData }
          : student
      );
    }

    setStudents(updatedStudents);
    saveStudents(updatedStudents);
    setSelectedStudentId(newSelectedId);
    saveSelectedStudentId(newSelectedId);
    setEditingProfile(false);
    setCreatingProfile(false);
    showNotice("Profile saved.", "success");
  }

  function myApplications() {
    if (!selectedStudent) return [];
    return applications
      .filter((app) => app.studentId === selectedStudent.id)
      .map((app) => {
        const project = projects.find((item) => item.id === app.projectId);
        return { ...app, projectTitle: project ? project.title : "Unknown project" };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function myProjects() {
    return myApplications().filter((app) => app.status === "Accepted");
  }

  if (!ready) {
    return (
      <main>
        <div className="panel">
          <p className="muted">Loading student dashboard...</p>
        </div>
      </main>
    );
  }

  const visibleProjects = filteredProjects();

  return (
    <main>
      <div className="panel">
        <h1 className="panel-title">Explore Honda Projects</h1>
        <p className="panel-subtitle">
          Find projects that match your skills and interests.
        </p>

        <div className="student-select-row">
          <div className="form-row">
            <label className="form-label" htmlFor="demo-student">
              Demo student
            </label>
            <select
              id="demo-student"
              value={selectedStudentId || ""}
              onChange={(event) => handleSelectStudent(event.target.value)}
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} — {student.major}
                </option>
              ))}
            </select>
          </div>
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={startCreateProfile}
            >
              New Profile
            </button>
            {selectedStudent && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={startEditProfile}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {message && (
          <div
            className={`message${
              message.type === "error"
                ? " message-error"
                : message.type === "success"
                  ? ""
                  : " message-info"
            }`}
          >
            {message.text}
          </div>
        )}

        {(editingProfile || creatingProfile) && (
          <form className="form-grid" onSubmit={saveProfile}>
            <h2 className="section-title">
              {creatingProfile ? "Create Student Profile" : "Edit Student Profile"}
            </h2>
            <div className="form-row-2">
              <div className="form-row">
                <label className="form-label" htmlFor="student-name">
                  Full name
                </label>
                <input
                  id="student-name"
                  type="text"
                  value={profileForm.name}
                  onChange={(event) =>
                    setProfileForm({ ...profileForm, name: event.target.value })
                  }
                  required
                />
              </div>
              <div className="form-row">
                <label className="form-label" htmlFor="student-major">
                  Major
                </label>
                <input
                  id="student-major"
                  type="text"
                  value={profileForm.major}
                  onChange={(event) =>
                    setProfileForm({ ...profileForm, major: event.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-row">
                <label className="form-label" htmlFor="student-year">
                  Academic year
                </label>
                <select
                  id="student-year"
                  value={profileForm.year}
                  onChange={(event) =>
                    setProfileForm({ ...profileForm, year: event.target.value })
                  }
                >
                  {ACADEMIC_YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label className="form-label" htmlFor="student-availability">
                  Weekly availability
                </label>
                <input
                  id="student-availability"
                  type="text"
                  placeholder="e.g. 8 hours/week"
                  value={profileForm.availability}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      availability: event.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="form-row">
              <label className="form-label" htmlFor="student-skills">
                Skills (comma-separated)
              </label>
              <input
                id="student-skills"
                type="text"
                value={profileForm.skillsText}
                onChange={(event) =>
                  setProfileForm({
                    ...profileForm,
                    skillsText: event.target.value,
                  })
                }
              />
            </div>
            <div className="form-row">
              <label className="form-label" htmlFor="student-interests">
                Interests (comma-separated)
              </label>
              <input
                id="student-interests"
                type="text"
                value={profileForm.interestsText}
                onChange={(event) =>
                  setProfileForm({
                    ...profileForm,
                    interestsText: event.target.value,
                  })
                }
              />
            </div>
            <div className="btn-group">
              <button type="submit" className="btn">
                Save Profile
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setEditingProfile(false);
                  setCreatingProfile(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {!editingProfile && !creatingProfile && selectedStudent && (
          <div className="detail-block">
            <p>
              <strong>{selectedStudent.name}</strong> — {selectedStudent.major},{" "}
              {selectedStudent.year}
            </p>
            <p className="meta-row">
              <strong>Skills:</strong> {selectedStudent.skills.join(", ") || "None listed"}
            </p>
            <p className="meta-row">
              <strong>Interests:</strong>{" "}
              {selectedStudent.interests.join(", ") || "None listed"}
            </p>
            <p className="meta-row">
              <strong>Availability:</strong> {selectedStudent.availability}
            </p>
          </div>
        )}
      </div>

      <div className="sub-nav">
        <button
          type="button"
          className={activeSection === "projects" ? "active" : ""}
          onClick={() => setActiveSection("projects")}
        >
          Projects
        </button>
        <button
          type="button"
          className={activeSection === "applications" ? "active" : ""}
          onClick={() => setActiveSection("applications")}
        >
          My Applications
        </button>
        <button
          type="button"
          className={activeSection === "my-projects" ? "active" : ""}
          onClick={() => setActiveSection("my-projects")}
        >
          My Projects
        </button>
      </div>

      {activeSection === "projects" && (
        <>
          <div className="panel">
            <h2 className="section-title">Filter Projects</h2>
            <div className="filter-bar">
              <div className="form-row filter-search">
                <label className="form-label" htmlFor="project-search">
                  Search by title
                </label>
                <input
                  id="project-search"
                  type="text"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search projects"
                />
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: "0.4rem" }}>
                  Categories
                </div>
                <div className="checkbox-grid">
                  {CATEGORIES.map((category) => (
                    <label key={category} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                      />
                      {category}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {selectedProject ? (
            <div className="panel">
              <div className="btn-group" style={{ marginBottom: "1rem" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeProjectDetails}
                >
                  Back to Projects
                </button>
              </div>
              <h2 className="panel-title">{selectedProject.title}</h2>
              <div className="detail-block">
                <p>{selectedProject.description}</p>
                <p>
                  <strong>Categories:</strong>{" "}
                  {selectedProject.categories.join(", ")}
                </p>
                <p>
                  <strong>Required skills:</strong>{" "}
                  {selectedProject.skills.join(", ")}
                </p>
                <p>
                  <strong>Weekly hours:</strong> {selectedProject.weeklyHours}
                </p>
                <p>
                  <strong>Duration:</strong> {selectedProject.duration}
                </p>
                <p>
                  <strong>Available positions:</strong>{" "}
                  {getAvailablePositions(selectedProject, applications)}
                </p>
                <p>
                  <strong>Expected outcome:</strong>{" "}
                  {selectedProject.expectedOutcome}
                </p>
                <p
                  className={
                    selectedProject.status === "open"
                      ? "status-open"
                      : "status-closed"
                  }
                >
                  Status: {selectedProject.status === "open" ? "Open" : "Closed"}
                </p>
              </div>

              {!showApplyForm && (
                <button type="button" className="btn" onClick={startApply}>
                  Apply to Project
                </button>
              )}

              {showApplyForm && (
                <form className="form-grid" onSubmit={submitApplication}>
                  <h3 className="section-title">Application</h3>
                  <p className="muted">
                    Applying as <strong>{selectedStudent.name}</strong>
                  </p>
                  <div className="form-row">
                    <label className="form-label" htmlFor="interest-message">
                      Why are you interested in this project?
                    </label>
                    <textarea
                      id="interest-message"
                      value={interestMessage}
                      onChange={(event) =>
                        setInterestMessage(event.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="btn-group">
                    <button type="submit" className="btn">
                      Submit Application
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setShowApplyForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : visibleProjects.length === 0 ? (
            <div className="empty-state">
              No projects match your current filters.
            </div>
          ) : (
            <div className="card-grid">
              {visibleProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  availablePositions={getAvailablePositions(
                    project,
                    applications
                  )}
                  onViewDetails={openProjectDetails}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeSection === "applications" && (
        <div className="panel">
          <h2 className="section-title">My Applications</h2>
          {!selectedStudent ? (
            <div className="empty-state">
              Select a student profile to view applications.
            </div>
          ) : myApplications().length === 0 ? (
            <div className="empty-state">
              You have not applied to any projects yet.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Project title</th>
                    <th>Application date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myApplications().map((app) => (
                    <tr key={app.id}>
                      <td>{app.projectTitle}</td>
                      <td>{new Date(app.date).toLocaleDateString()}</td>
                      <td>
                        <span
                          className={
                            app.status === "Accepted"
                              ? "status-accepted"
                              : app.status === "Rejected"
                                ? "status-rejected"
                                : "status-pending"
                          }
                        >
                          {app.status}
                        </span>
                        {app.status === "Accepted" && (
                          <div className="meta-row">
                            You have been selected for this project.
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSection === "my-projects" && (
        <div className="panel">
          <h2 className="section-title">My Projects</h2>
          {!selectedStudent ? (
            <div className="empty-state">
              Select a student profile to view accepted projects.
            </div>
          ) : myProjects().length === 0 ? (
            <div className="empty-state">
              No accepted projects yet.
            </div>
          ) : (
            <div className="card-grid">
              {myProjects().map((app) => {
                const project = projects.find(
                  (item) => item.id === app.projectId
                );
                if (!project) return null;
                return (
                  <article key={app.id} className="project-card">
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <div className="meta-row">
                      <strong>Duration:</strong> {project.duration}
                    </div>
                    <div className="meta-row">
                      <strong>Weekly hours:</strong> {project.weeklyHours}
                    </div>
                    <div className="status-accepted">Accepted</div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
