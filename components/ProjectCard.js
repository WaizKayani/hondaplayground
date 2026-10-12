export default function ProjectCard({
  project,
  availablePositions,
  onViewDetails,
}) {
  return (
    <article className="project-card">
      <h3>{project.title}</h3>
      <p>{project.description}</p>
      <div className="tag-list">
        {project.categories.map((category) => (
          <span key={category} className="tag tag-category">
            {category}
          </span>
        ))}
      </div>
      <div className="meta-row">
        <strong>Skills:</strong> {project.skills.join(", ")}
      </div>
      <div className="meta-row">
        <strong>Weekly hours:</strong> {project.weeklyHours}
      </div>
      <div className="meta-row">
        <strong>Duration:</strong> {project.duration}
      </div>
      <div className="meta-row">
        <strong>Available positions:</strong> {availablePositions}
      </div>
      <div
        className={
          project.status === "open" ? "status-open" : "status-closed"
        }
      >
        {project.status === "open" ? "Open" : "Closed"}
      </div>
      <div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onViewDetails(project)}
        >
          View Details
        </button>
      </div>
    </article>
  );
}
