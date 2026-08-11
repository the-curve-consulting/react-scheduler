import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import GanttDemo from "./GanttDemo";

// Two demos, one dev server: /#gantt shows the Gantt harness, anything else
// shows the Scheduler demo exactly as before.
const Demo = window.location.hash === "#gantt" ? GanttDemo : App;

window.addEventListener("hashchange", () => window.location.reload());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Demo />
  </React.StrictMode>
);
