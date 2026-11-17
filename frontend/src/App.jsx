import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutDashboard, CheckSquare, FolderKanban, CalendarDays, Users, ChartNoAxesCombined, Settings, Bell, Search, Plus, ChevronDown, MoreHorizontal, ArrowUpRight, ListFilter, CircleHelp, LogOut, Check, Menu, X } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { createTask, getTasks } from "./api";
import "./App.css";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Tasks", icon: CheckSquare },
  { label: "Projects", icon: FolderKanban },
  { label: "Calendar", icon: CalendarDays },
  { label: "Team Members", icon: Users },
  { label: "Reports & Analytics", icon: ChartNoAxesCombined },
  { label: "Settings", icon: Settings },
];

const initialProjects = [
  { id: 1, name: "Website redesign", desc: "A fresh experience for our next product launch.", progress: 75, tasks: "24/32", date: "Oct 23", color: "#5145e5", status: "On track" },
  { id: 2, name: "Mobile app", desc: "Taking the mobile experience to the next level.", progress: 60, tasks: "18/30", date: "Oct 28", color: "#119c8d", status: "At risk" },
  { id: 3, name: "Design system", desc: "Reusable components for every product.", progress: 70, tasks: "14/20", date: "Nov 06", color: "#e64768", status: "On track" },
];

const initialTasks = [
  { id: "demo-1", title: "Finalize homepage wireframes", project: "Website redesign", priority: "High", due_date: "2026-10-12", status: "In Progress" },
  { id: "demo-2", title: "Review onboarding flow", project: "Mobile app", priority: "High", due_date: "2026-10-12", status: "In Review" },
  { id: "demo-3", title: "Build button components", project: "Design system", priority: "Medium", due_date: "2026-10-13", status: "In Progress" },
  { id: "demo-4", title: "Implement push notifications", project: "Mobile app", priority: "High", due_date: "2026-10-14", status: "To Do" },
  { id: "demo-5", title: "Audit accessibility contrast", project: "Design system", priority: "Medium", due_date: "2026-10-15", status: "To Do" },
  { id: "demo-6", title: "Document spacing tokens", project: "Design system", priority: "Low", due_date: "2026-10-16", status: "Completed" },
];

const weekly = [
  { day: "Mon", tasks: 18 }, { day: "Tue", tasks: 25 }, { day: "Wed", tasks: 22 },
  { day: "Thu", tasks: 35 }, { day: "Fri", tasks: 29 }, { day: "Sat", tasks: 24 }, { day: "Sun", tasks: 32 },
];

function Sidebar({ active, setActive, open, close }) {
  return (
    <>
      {open && (<button className="mobile-scrim" onClick={close} aria-label="Close menu" />)}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">✓</span> TaskFlow
          <button className="mobile-close" onClick={close}><X size={17} /></button>
        </div>
        <button className="workspace">▦ <span>Studio workspace</span><ChevronDown size={14} /></button>
        <nav>
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${active === label ? "active" : ""}`} onClick={() => { setActive(label); close(); }}>
              <Icon size={16} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-box">
            <CircleHelp size={18} />
            <strong>Need more room to grow?</strong>
            <p>Bring your team together with unlimited projects.</p>
            <a href="#projects">Explore Pro →</a>
          </div>
          <div className="profile">
            <div className="avatar">AM</div>
            <div><strong>Alex Morgan</strong><small>alex@example.com</small></div>
            <ChevronDown size={14} />
          </div>
          <button className="logout"><LogOut size={14} /> Log out</button>
        </div>
      </aside>
    </>
  );
}

function StatCard({ label, value, trend, icon: Icon }) {
  return (
    <article className="stat-card">
      <div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={15} /></span></div>
      <div className="stat-number">{value}</div>
      <div className="trend">{trend} <span>vs. last month</span></div>
    </article>
  );
}

function ProjectCard({ project }) {
  return (
    <article className="project-card">
      <div className="project-top">
        <span className="project-icon" style={{ color: project.color, background: `${project.color}14` }}><FolderKanban size={17} /></span>
        <button className="icon-button" aria-label="Project options"><MoreHorizontal size={18} /></button>
      </div>
      <h3>{project.name}</h3>
      <p className="project-desc">{project.desc}</p>
      <div className="progress-label"><span>Progress</span><strong>{project.progress}%</strong></div>
      <div className="progress-track"><div style={{ width: `${project.progress}%`, background: project.color }} /></div>
      <div className="project-meta"><span>{project.tasks} tasks completed</span><span>◷ {project.date}</span></div>
      <div className="project-footer">
        <div className="avatar-stack"><span>AM</span><span>JD</span><span>SK</span></div>
        <span className={`status ${project.status === "At risk" ? "risk" : "good"}`}>{project.status}</span>
      </div>
    </article>
  );
}

export default function App() {
  const [active, setActive] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState("Assigned to me");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [apiMessage, setApiMessage] = useState("Sample data until API connection");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function loadTasks() {
      setFetching(true);
      try {
        const rows = await getTasks();
        if (!cancelled && Array.isArray(rows)) {
          setTasks(rows);
          setApiMessage("Tasks loaded from the API.");
        }
      } catch (error) {
        console.error("Fetch tasks error:", error.response?.data || error.message);
        if (!cancelled) setApiMessage("Could not load tasks from the API. Showing sample data.");
      } finally {
        if (!cancelled) setFetching(false);
      }
    }
    loadTasks();
    return () => { cancelled = true; };
  }, []);

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      const title = (task.title || "").toLowerCase();
      const matchesSearch = title.includes(query.trim().toLowerCase());
      const matchesFilter = filter !== "Completed" || task.status === "Completed";
      return matchesSearch && matchesFilter;
    });
  }, [tasks, query, filter]);

  async function addTask(e) {
    e.preventDefault();
    if (!newTitle.trim() || submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setApiMessage("");
    const payload = { title: newTitle.trim(), description: "", priority: newPriority, status: "To Do", due_date: null, project_id: null };
    try {
      const saved = await createTask(payload);
      if (!saved || saved.id == null) throw new Error("The API response did not contain a saved task ID.");
      setTasks((previousTasks) => [
        { ...saved, project: saved.project?.name || saved.project || "Unassigned" },
        ...previousTasks.filter((task) => !String(task.id).startsWith("demo-")),
      ]);
      setApiMessage("Task saved to the database.");
      setNewTitle("");
      setNewPriority("Medium");
      setShowForm(false);
    } catch (error) {
      console.error("Create task API error:", error.response?.data || error.message);
      const validationErrors = error.response?.data?.errors;
      if (validationErrors) setApiMessage(Object.values(validationErrors).flat().join(" "));
      else if (error.response) setApiMessage(error.response.data?.message || `The API returned HTTP ${error.response.status}.`);
      else setApiMessage("Could not connect to the API. No local task was added.");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  function toggleTask(task) {
    const status = task.status === "Completed" ? "To Do" : "Completed";
    setTasks((previousTasks) => previousTasks.map((item) => item.id === task.id ? { ...item, status } : item));
  }

  const pageTitle = active === "Dashboard" ? "Overview" : active;

  return (
    <div className="app-shell">
      <Sidebar active={active} setActive={setActive} open={menuOpen} close={() => setMenuOpen(false)} />

      <div className="workspace-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
            <div className="breadcrumbs">Workspace <span>›</span> {pageTitle}</div>
          </div>
          <div className="top-actions">
            <label className="search">
              <Search size={15} />
              <input placeholder="Search tasks..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <button className="icon-button notification" aria-label="Notifications"><Bell size={18} /></button>
            <button className="primary-button" onClick={() => setShowForm(true)}><Plus size={15} /> Create New</button>
            <div className="avatar top-avatar">AM</div>
          </div>
        </header>

        {active === "Dashboard" ? (
          <main className="main-content">
            <div className="welcome-row">
              <div>
                <h1>Good morning, Alex!</h1>
                <p>Here's what's happening with your projects today.</p>
              </div>
              <button className="primary-button" onClick={() => setShowForm(true)}><Plus size={15} /> Create Project</button>
            </div>

            <section className="stats-grid">
              <StatCard label="Total Projects" value="12" trend="+2" icon={FolderKanban} />
              <StatCard label="Active Projects" value="8" trend="+1" icon={ChartNoAxesCombined} />
              <StatCard label="Tasks In Progress" value={tasks.filter((task) => task.status === "In Progress").length + 26} trend="+4" icon={CheckSquare} />
              <StatCard label="Completed Tasks" value={tasks.filter((task) => task.status === "Completed").length + 90} trend="+18" icon={Check} />
            </section>

            <section className="analytics-grid">
              <article className="panel">
                <div className="panel-heading">
                  <div><h2>Weekly task completion</h2><p>Tasks completed this week</p></div>
                  <MoreHorizontal size={18} />
                </div>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekly}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip />
                      <Bar dataKey="tasks" fill="#5145e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-foot">42 <span>tasks completed this week</span></div>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div><h2>Project progress</h2><p>Your three most recent projects</p></div>
                  <MoreHorizontal size={18} />
                </div>
                {initialProjects.map((project) => (
                  <div className="mini-project" key={project.id}>
                    <div><strong>{project.name}</strong><b>{project.progress}%</b></div>
                    <div className="progress-track"><div style={{ width: `${project.progress}%`, background: project.color }} /></div>
                    <small>{project.tasks} tasks completed</small>
                  </div>
                ))}
              </article>

              <article className="panel distribution">
                <div className="panel-heading">
                  <div><h2>Task distribution</h2><p>Tasks by status</p></div>
                  <MoreHorizontal size={18} />
                </div>
                <div className="donut-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Completed", value: 96 },
                          { name: "In progress", value: 32 },
                          { name: "To Do", value: 20 },
                          { name: "In review", value: 12 },
                        ]}
                        dataKey="value"
                        innerRadius="66%"
                        outerRadius="88%"
                        paddingAngle={3}
                      >
                        {["#5145e5", "#8176f4", "#f4bd4e", "#b9c2d2"].map((color, index) => (<Cell key={index} fill={color} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center"><strong>160</strong><span>Total tasks</span></div>
                </div>
                <div className="legend">
                  <span><i style={{ background: "#5145e5" }} />Completed</span>
                  <span><i style={{ background: "#8176f4" }} />In progress</span>
                  <span><i style={{ background: "#f4bd4e" }} />To Do</span>
                  <span><i style={{ background: "#b9c2d2" }} />In review</span>
                </div>
              </article>
            </section>

            <section className="section-block" id="projects">
              <div className="section-heading">
                <h2>Recent Projects <span>3</span></h2>
                <button className="text-button" onClick={() => setActive("Projects")}>View all <ArrowUpRight size={14} /></button>
              </div>
              <div className="projects-grid">
                {initialProjects.map((project) => (<ProjectCard key={project.id} project={project} />))}
              </div>
            </section>

            <section className="section-block">
              <div className="section-heading">
                <h2>My Tasks <span>{visibleTasks.length}</span></h2>
                <button className="text-button" onClick={() => setFilter(filter === "Completed" ? "Assigned to me" : "Completed")}>
                  <ListFilter size={14} /> {filter === "Completed" ? "Show all" : "Completed"}
                </button>
              </div>
              <div className="task-panel">
                <div className="task-tabs">
                  {["Assigned to me", "All tasks", "Completed"].map((tab) => (
                    <button key={tab} className={filter === tab ? "selected" : ""} onClick={() => setFilter(tab)}>{tab}</button>
                  ))}
                </div>
                <div className="task-table-wrap">
                  <table className="task-table">
                    <thead>
                      <tr><th>Task Name</th><th>Project</th><th>Priority</th><th>Due Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {visibleTasks.map((task, index) => (
                        <tr key={task.id ?? index}>
                          <td>
                            <input type="checkbox" checked={task.status === "Completed"} onChange={() => toggleTask(task)} />
                            {task.title}
                          </td>
                          <td>{task.project?.name || task.project || "Unassigned"}</td>
                          <td><span className={`priority ${(task.priority || "Medium").toLowerCase()}`}>● {task.priority || "Medium"}</span></td>
                          <td>{task.due_date || "—"}</td>
                          <td>
                            <span className={`status ${task.status === "Completed" ? "good" : task.status === "To Do" ? "todo" : task.status === "In Review" ? "risk" : "progress-status"}`}>
                              {task.status || "To Do"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {visibleTasks.length === 0 && (<div className="empty-state">No tasks match your search.</div>)}
                </div>
                <div className="table-footer">
                  Showing {visibleTasks.length} tasks
                  <span>{fetching ? "Loading tasks..." : apiMessage}</span>
                </div>
              </div>
            </section>
          </main>
        ) : (
          <main className="placeholder-page">
            <h1>{active}</h1>
            <p>This section is scaffolded for the next development phase.</p>
            {active === "Projects" && (
              <div className="projects-grid">
                {initialProjects.map((project) => (<ProjectCard key={project.id} project={project} />))}
              </div>
            )}
            <button className="primary-button" onClick={() => setActive("Dashboard")}>Return to Dashboard</button>
          </main>
        )}
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={() => { if (!loading) setShowForm(false); }}>
          <form className="modal" onSubmit={addTask} onClick={(event) => event.stopPropagation()}>
            <h2>Create a task</h2>
            <p>New tasks will be saved through the Laravel API.</p>
            <label>
              Task title
              <input autoFocus value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="e.g. Design login page" required disabled={loading} />
            </label>
            <label>
              Priority
              <select value={newPriority} onChange={(event) => setNewPriority(event.target.value)} disabled={loading}>
                <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
              </select>
            </label>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setShowForm(false)} disabled={loading}>Cancel</button>
              <button className="primary-button" type="submit" disabled={loading || !newTitle.trim()}>
                {loading ? "Saving..." : "Create task"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}