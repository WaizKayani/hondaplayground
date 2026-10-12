"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ACADEMIC_YEARS } from "../../../data/students";
import {
  createId,
  getStudents,
  saveSelectedStudentId,
  saveStudents,
} from "../../../lib/storage";

const emptyProfile = {
  name: "",
  major: "",
  year: "Freshman",
  skillsText: "",
  interestsText: "",
  availability: "",
};

export default function SelectProfilePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [students, setStudents] = useState([]);
  const [mode, setMode] = useState("choose");
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setStudents(getStudents());
    setReady(true);
  }, []);

  function parseList(text) {
    return text
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function selectExistingProfile(studentId) {
    saveSelectedStudentId(studentId);
    router.push("/student");
  }

  function createProfile(event) {
    event.preventDefault();
    if (!profileForm.name.trim() || !profileForm.major.trim()) {
      setMessage({ text: "Name and major are required.", type: "error" });
      return;
    }

    const newStudent = {
      id: createId("stu"),
      name: profileForm.name.trim(),
      major: profileForm.major.trim(),
      year: profileForm.year,
      skills: parseList(profileForm.skillsText),
      interests: parseList(profileForm.interestsText),
      availability: profileForm.availability.trim() || "Not specified",
    };

    const updatedStudents = [...students, newStudent];
    saveStudents(updatedStudents);
    saveSelectedStudentId(newStudent.id);
    router.push("/student");
  }

  if (!ready) {
    return (
      <main>
        <div className="panel">
          <p className="muted">Loading profiles...</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="panel">
        <h1 className="panel-title">Select Student Profile</h1>
        <p className="panel-subtitle">
          Choose an existing demo profile or create a new one to continue.
        </p>

        <div className="sub-nav">
          <button
            type="button"
            className={mode === "choose" ? "active" : ""}
            onClick={() => {
              setMode("choose");
              setMessage(null);
            }}
          >
            Choose Existing Profile
          </button>
          <button
            type="button"
            className={mode === "create" ? "active" : ""}
            onClick={() => {
              setMode("create");
              setMessage(null);
              setProfileForm(emptyProfile);
            }}
          >
            Create New Profile
          </button>
        </div>

        {message && (
          <div
            className={`message${
              message.type === "error" ? " message-error" : ""
            }`}
          >
            {message.text}
          </div>
        )}

        {mode === "choose" && (
          <>
            {students.length === 0 ? (
              <div className="empty-state">
                No profiles found. Create a new profile to continue.
              </div>
            ) : (
              <div className="card-grid">
                {students.map((student) => (
                  <article key={student.id} className="project-card">
                    <h3>{student.name}</h3>
                    <p>
                      {student.major}, {student.year}
                    </p>
                    <div className="meta-row">
                      <strong>Skills:</strong>{" "}
                      {student.skills.join(", ") || "None listed"}
                    </div>
                    <div className="meta-row">
                      <strong>Interests:</strong>{" "}
                      {student.interests.join(", ") || "None listed"}
                    </div>
                    <div className="meta-row">
                      <strong>Availability:</strong> {student.availability}
                    </div>
                    <div>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => selectExistingProfile(student.id)}
                      >
                        Select Profile
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {mode === "create" && (
          <form className="form-grid" onSubmit={createProfile}>
            <h2 className="section-title">Create Student Profile</h2>
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
                Create and Continue
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setMode("choose");
                  setProfileForm(emptyProfile);
                  setMessage(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
