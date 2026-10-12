"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "../../data/projects";
import {
  createId,
  getApplications,
  getAvailablePositions,
  getProjects,
  getStudents,
  saveApplications,
  saveProjects,
} from "../../lib/storage";

const emptyProjectForm = {
  title: "",
  description: "",
  categories: [],
  skillsText: "",
  weeklyHours: 4,
  duration: "",
  positions: 1,
  expectedOutcome: "",
  status: "open",
};

export default function HondaPage() {
  const [ready, setReady] = useState(false);
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [view, setView] = useState("dashboard");
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [message, setMessage] = useState(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);

  useEffect(() => {
    setProjects(getProjects());
    setStudents(getStudents());
    setApplications(getApplications());
    setReady(true);
  }, []);

  function showNotice(text, type = "info") {
    setMessage({ text, type });
  }

  function refreshFromStorage() {
    setProjects(getProjects());
    setStudents(getStudents());
    setApplications(getApplications());
  }

  function openProjectsCount() {
    return projects.filter((project) => project.status === "open").length;
  }

  function pendingApplicationsCount() {
    return applications.filter((app) => app.status === "Pending").length;
  }

  function acceptedStudentsCount() {
    return applications.filter((app) => app.status === "Accepted").length;
  }

  function toggleFormCategory(category) {
    setProjectForm((current) => {
      if (current.categories.includes(category)) {
        return {
          ...current,
          categories: current.categories.filter((item) => item !== category),
        };
      }
      return {
        ...current,
        categories: [...current.categories, category],
      };
    });
  }

  function startAddProject() {
    setEditingProjectId(null);
    setProjectForm(emptyProjectForm);
    setShowProjectForm(true);
    setMessage(null);
  }

  function startEditProject(project) {
    setEditingProjectId(project.id);
    setProjectForm({
      title: project.title,
      description: project.description,
      categories: [...project.categories],
      skillsText: project.skills.join(", "),
      weeklyHours: project.weeklyHours,
      duration: project.duration,
      positions: project.positions,
      expectedOutcome: project.expectedOutcome,
      status: project.status,
    });
    setShowProjectForm(true);
    setMessage(null);
  }

  function saveProject(event) {
    event.preventDefault();

    if (!projectForm.title.trim() || !projectForm.description.trim()) {
      showNotice("Title and description are required.", "error");
      return;
    }
    if (projectForm.categories.length === 0) {
      showNotice("Select at least one category.", "error");
      return;
    }

    const skills = projectForm.skillsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const projectData = {
      title: projectForm.title.trim(),
      description: projectForm.description.trim(),
      categories: projectForm.categories,
      skills,
      weeklyHours: Number(projectForm.weeklyHours) || 1,
      duration: projectForm.duration.trim() || "TBD",
      positions: Number(projectForm.positions) || 1,
      expectedOutcome: projectForm.expectedOutcome.trim() || "TBD",
      status: projectForm.status,
    };

    let updatedProjects;
    if (editingProjectId) {
      const existing = projects.find((item) => item.id === editingProjectId);
      const acceptedCount = applications.filter(
        (app) =>
          app.projectId === editingProjectId && app.status === "Accepted"
      ).length;
      if (projectData.positions < acceptedCount) {
        showNotice(
          `Cannot set positions below the ${acceptedCount} already accepted student(s).`,
          "error"
        );
        return;
      }
      updatedProjects = projects.map((project) =>
        project.id === editingProjectId
          ? { ...existing, ...projectData }
          : project
      );
    } else {
      updatedProjects = [
        ...projects,
        {
          id: createId("proj"),
          ...projectData,
        },
      ];
    }

    setProjects(updatedProjects);
    saveProjects(updatedProjects);
    setShowProjectForm(false);
    setEditingProjectId(null);
    showNotice(
      editingProjectId ? "Project updated." : "Project created.",
      "success"
    );
  }

  function toggleProjectStatus(project) {
    const acceptedCount = applications.filter(
      (app) => app.projectId === project.id && app.status === "Accepted"
    ).length;
    const nextStatus = project.status === "open" ? "closed" : "open";

    if (nextStatus === "open" && acceptedCount >= project.positions) {
      showNotice(
        "Cannot reopen a project with no remaining positions. Increase positions first.",
        "error"
      );
      return;
    }

    const updatedProjects = projects.map((item) =>
      item.id === project.id ? { ...item, status: nextStatus } : item
    );
    setProjects(updatedProjects);
    saveProjects(updatedProjects);
    showNotice(
      nextStatus === "open" ? "Project marked open." : "Project marked closed.",
      "success"
    );
  }

  function getStudent(studentId) {
    return students.find((student) => student.id === studentId) || null;
  }

  function getProject(projectId) {
    return projects.find((project) => project.id === projectId) || null;
  }

  function acceptApplication(application) {
    const project = getProject(application.projectId);
    if (!project) {
      showNotice("Project not found.", "error");
      return;
    }

    if (application.status === "Accepted") {
      showNotice("This application is already accepted.", "error");
      return;
    }

    const available = getAvailablePositions(project, applications);
    if (available <= 0 || project.status !== "open") {
      showNotice(
        "Cannot accept more students. Project is full or closed.",
        "error"
      );
      return;
    }

    const duplicateAccepted = applications.some(
      (app) =>
        app.id !== application.id &&
        app.projectId === application.projectId &&
        app.studentId === application.studentId &&
        app.status === "Accepted"
    );
    if (duplicateAccepted) {
      showNotice("This student is already accepted for this project.", "error");
      return;
    }

    const updatedApplications = applications.map((app) =>
      app.id === application.id ? { ...app, status: "Accepted" } : app
    );
    setApplications(updatedApplications);
    saveApplications(updatedApplications);

    const remaining = getAvailablePositions(project, updatedApplications);
    if (remaining <= 0) {
      const updatedProjects = projects.map((item) =>
        item.id === project.id ? { ...item, status: "closed" } : item
      );
      setProjects(updatedProjects);
      saveProjects(updatedProjects);
    }

    showNotice("Application accepted.", "success");
  }

  function rejectApplication(application) {
    if (application.status === "Rejected") {
      showNotice("This application is already rejected.", "error");
      return;
    }

    const updatedApplications = applications.map((app) =>
      app.id === application.id ? { ...app, status: "Rejected" } : app
    );
    setApplications(updatedApplications);
    saveApplications(updatedApplications);
    showNotice("Application rejected.", "success");
  }

  function projectTeams() {
    return projects
      .map((project) => {
        const acceptedApps = applications.filter(
          (app) =>
            app.projectId === project.id && app.status === "Accepted"
        );
        const members = acceptedApps
          .map((app) => getStudent(app.studentId))
          .filter(Boolean);
        return { project, members };
      })
      .filter((team) => team.members.length > 0);
  }

  if (!ready) {
    return (
      <main>
        <div className="panel">
          <p className="muted">Loading Honda dashboard...</p>
        </div>
      </main>
    );
  }

  const selectedApplication = applications.find(
    (app) => app.id === selectedApplicationId
  );

  return (
    <main>
      <div className="panel">
        <h1 className="panel-title">Honda Dashboard</h1>
        <p className="panel-subtitle">
          Review projects, applications, and student teams for this prototype
          demo.
        </p>
      </div>

      <div className="sub-nav">
        <button
          type="button"
          className={view === "dashboard" ? "active" : ""}
          onClick={() => {
            setView("dashboard");
            refreshFromStorage();
          }}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={view === "projects" ? "active" : ""}
          onClick={() => {
            setView("projects");
            setShowProjectForm(false);
            refreshFromStorage();
          }}
        >
          Manage Projects
        </button>
        <button
          type="button"
          className={view === "applications" ? "active" : ""}
          onClick={() => {
            setView("applications");
            setSelectedApplicationId(null);
            refreshFromStorage();
          }}
        >
          Applications
        </button>
        <button
          type="button"
          className={view === "teams" ? "active" : ""}
          onClick={() => {
            setView("teams");
            refreshFromStorage();
          }}
        >
          Project Teams
        </button>
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

      {view === "dashboard" && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Total projects</div>
            <div className="stat-value">{projects.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Open projects</div>
            <div className="stat-value">{openProjectsCount()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending applications</div>
            <div className="stat-value">{pendingApplicationsCount()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Accepted students</div>
            <div className="stat-value">{acceptedStudentsCount()}</div>
          </div>
        </div>
      )}

      {view === "projects" && (
        <>
          <div className="panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "0.75rem",
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                Manage Projects
              </h2>
              {!showProjectForm && (
                <button type="button" className="btn" onClick={startAddProject}>
                  Add Project
                </button>
              )}
            </div>

            {showProjectForm && (
              <form className="form-grid" onSubmit={saveProject}>
                <h3 className="section-title">
                  {editingProjectId ? "Edit Project" : "Add Project"}
                </h3>
                <div className="form-row">
                  <label className="form-label" htmlFor="proj-title">
                    Title
                  </label>
                  <input
                    id="proj-title"
                    type="text"
                    value={projectForm.title}
                    onChange={(event) =>
                      setProjectForm({
                        ...projectForm,
                        title: event.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-row">
                  <label className="form-label" htmlFor="proj-description">
                    Description
                  </label>
                  <textarea
                    id="proj-description"
                    value={projectForm.description}
                    onChange={(event) =>
                      setProjectForm({
                        ...projectForm,
                        description: event.target.value,
                      })
                    }
                    required
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
                          checked={projectForm.categories.includes(category)}
                          onChange={() => toggleFormCategory(category)}
                        />
                        {category}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-row">
                  <label className="form-label" htmlFor="proj-skills">
                    Required skills (comma-separated)
                  </label>
                  <input
                    id="proj-skills"
                    type="text"
                    value={projectForm.skillsText}
                    onChange={(event) =>
                      setProjectForm({
                        ...projectForm,
                        skillsText: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-row-2">
                  <div className="form-row">
                    <label className="form-label" htmlFor="proj-hours">
                      Weekly hours
                    </label>
                    <input
                      id="proj-hours"
                      type="number"
                      min="1"
                      value={projectForm.weeklyHours}
                      onChange={(event) =>
                        setProjectForm({
                          ...projectForm,
                          weeklyHours: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-row">
                    <label className="form-label" htmlFor="proj-duration">
                      Duration
                    </label>
                    <input
                      id="proj-duration"
                      type="text"
                      placeholder="e.g. 6 weeks"
                      value={projectForm.duration}
                      onChange={(event) =>
                        setProjectForm({
                          ...projectForm,
                          duration: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-row">
                    <label className="form-label" htmlFor="proj-positions">
                      Number of student positions
                    </label>
                    <input
                      id="proj-positions"
                      type="number"
                      min="1"
                      value={projectForm.positions}
                      onChange={(event) =>
                        setProjectForm({
                          ...projectForm,
                          positions: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-row">
                    <label className="form-label" htmlFor="proj-status">
                      Status
                    </label>
                    <select
                      id="proj-status"
                      value={projectForm.status}
                      onChange={(event) =>
                        setProjectForm({
                          ...projectForm,
                          status: event.target.value,
                        })
                      }
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <label className="form-label" htmlFor="proj-outcome">
                    Expected outcome
                  </label>
                  <textarea
                    id="proj-outcome"
                    value={projectForm.expectedOutcome}
                    onChange={(event) =>
                      setProjectForm({
                        ...projectForm,
                        expectedOutcome: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="btn-group">
                  <button type="submit" className="btn">
                    Save Project
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setShowProjectForm(false);
                      setEditingProjectId(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {!showProjectForm && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Categories</th>
                    <th>Positions</th>
                    <th>Available</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td>{project.title}</td>
                      <td>{project.categories.join(", ")}</td>
                      <td>{project.positions}</td>
                      <td>
                        {getAvailablePositions(project, applications)}
                      </td>
                      <td>
                        <span
                          className={
                            project.status === "open"
                              ? "status-open"
                              : "status-closed"
                          }
                        >
                          {project.status === "open" ? "Open" : "Closed"}
                        </span>
                      </td>
                      <td>
                        <div className="inline-actions">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => startEditProject(project)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => toggleProjectStatus(project)}
                          >
                            Mark {project.status === "open" ? "Closed" : "Open"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {view === "applications" && (
        <div className="panel">
          <h2 className="section-title">Applications</h2>
          {applications.length === 0 ? (
            <div className="empty-state">No applications submitted yet.</div>
          ) : selectedApplication ? (
            (() => {
              const student = getStudent(selectedApplication.studentId);
              const project = getProject(selectedApplication.projectId);
              return (
                <div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ marginBottom: "1rem" }}
                    onClick={() => setSelectedApplicationId(null)}
                  >
                    Back to Applications
                  </button>
                  <div className="detail-block">
                    <p>
                      <strong>Project:</strong>{" "}
                      {project ? project.title : "Unknown project"}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span
                        className={
                          selectedApplication.status === "Accepted"
                            ? "status-accepted"
                            : selectedApplication.status === "Rejected"
                              ? "status-rejected"
                              : "status-pending"
                        }
                      >
                        {selectedApplication.status}
                      </span>
                    </p>
                    <p>
                      <strong>Submitted:</strong>{" "}
                      {new Date(selectedApplication.date).toLocaleString()}
                    </p>
                    {student ? (
                      <>
                        <p>
                          <strong>Student:</strong> {student.name}
                        </p>
                        <p>
                          <strong>Major:</strong> {student.major}
                        </p>
                        <p>
                          <strong>Year:</strong> {student.year}
                        </p>
                        <p>
                          <strong>Skills:</strong>{" "}
                          {student.skills.join(", ") || "None listed"}
                        </p>
                        <p>
                          <strong>Interests:</strong>{" "}
                          {student.interests.join(", ") || "None listed"}
                        </p>
                        <p>
                          <strong>Availability:</strong> {student.availability}
                        </p>
                      </>
                    ) : (
                      <p className="muted">Student profile not found.</p>
                    )}
                    <p>
                      <strong>Application message:</strong>
                    </p>
                    <p>{selectedApplication.message}</p>
                  </div>
                  {selectedApplication.status === "Pending" && (
                    <div className="btn-group">
                      <button
                        type="button"
                        className="btn"
                        onClick={() => acceptApplication(selectedApplication)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => rejectApplication(selectedApplication)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Project</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...applications]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((app) => {
                      const student = getStudent(app.studentId);
                      const project = getProject(app.projectId);
                      return (
                        <tr key={app.id}>
                          <td>{student ? student.name : "Unknown student"}</td>
                          <td>
                            {project ? project.title : "Unknown project"}
                          </td>
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
                          </td>
                          <td>
                            <div className="inline-actions">
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() =>
                                  setSelectedApplicationId(app.id)
                                }
                              >
                                View
                              </button>
                              {app.status === "Pending" && (
                                <>
                                  <button
                                    type="button"
                                    className="btn"
                                    onClick={() => acceptApplication(app)}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() => rejectApplication(app)}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === "teams" && (
        <div className="panel">
          <h2 className="section-title">Project Teams</h2>
          {projectTeams().length === 0 ? (
            <div className="empty-state">
              No accepted students yet. Accept applications to build teams.
            </div>
          ) : (
            projectTeams().map(({ project, members }) => (
              <div key={project.id} className="team-card">
                <h3>{project.title}</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Major</th>
                        <th>Skills</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((student) => (
                        <tr key={student.id}>
                          <td>{student.name}</td>
                          <td>{student.major}</td>
                          <td>{student.skills.join(", ") || "None listed"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
