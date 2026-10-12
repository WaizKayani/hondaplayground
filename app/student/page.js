"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProjectCard from "../../components/ProjectCard";
import { CATEGORIES } from "../../data/projects";
import {
  createId,
  getApplications,
  getAvailablePositions,
  getProjects,
  getSelectedStudentId,
  getStudents,
  saveApplications,
} from "../../lib/storage";

export default function StudentPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [interestMessage, setInterestMessage] = useState("");
  const [message, setMessage] = useState(null);
  const [activeSection, setActiveSection] = useState("projects");

  useEffect(() => {
    const loadedProjects = getProjects();
    const loadedStudents = getStudents();
    const loadedApplications = getApplications();
    let selectedId = getSelectedStudentId();

    if (selectedId && !loadedStudents.some((s) => s.id === selectedId)) {
      selectedId = null;
    }

    if (!selectedId) {
      router.replace("/student/select-profile");
      return;
    }

    const student =
      loadedStudents.find((item) => item.id === selectedId) || null;

    setProjects(loadedProjects);
    setSelectedStudent(student);
    setApplications(loadedApplications);
    setReady(true);
  }, [router]);

  function showNotice(text, type = "info") {
    setMessage({ text, type });
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

  function myApplications() {
    if (!selectedStudent) return [];
    return applications
      .filter((app) => app.studentId === selectedStudent.id)
      .map((app) => {
        const project = projects.find((item) => item.id === app.projectId);
        return {
          ...app,
          projectTitle: project ? project.title : "Unknown project",
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function myProjects() {
    return myApplications().filter((app) => app.status === "Accepted");
  }

  if (!ready || !selectedStudent) {
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
        <div className="student-dashboard-header">
          <div>
            <h1 className="panel-title">Explore Honda Projects</h1>
            <p className="panel-subtitle">
              Find projects that match your skills and interests.
            </p>
          </div>
          <div className="student-identity">
            <p className="student-identity-name">{selectedStudent.name}</p>
            <Link href="/student/select-profile" className="btn btn-outline">
              Switch Profile
            </Link>
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
          {!selectedProject && (
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
          )}

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
          {myApplications().length === 0 ? (
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
          {myProjects().length === 0 ? (
            <div className="empty-state">No accepted projects yet.</div>
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
