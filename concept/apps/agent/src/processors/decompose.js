// =============================================================================
// Decompose Processor
// =============================================================================
// Fetches the parent task, matches keywords against mock decompositions,
// and creates subtasks via the API.
// =============================================================================

const mockData = require("../mock-decompositions.json");

/**
 * Processes a decompose job: generates subtasks from mock patterns and
 * creates them via the API with parent_task_id set.
 */
async function processDecompose(job, apiUrl, pool) {
  // Fetch the parent task details
  const { rows } = await pool.query(
    "SELECT id, title, description, project_id, assigned_user_id FROM tasks WHERE id = $1",
    [job.task_id]
  );

  if (rows.length === 0) {
    throw new Error(`Task ${job.task_id} not found`);
  }

  const task = rows[0];
  const titleLower = (task.title + " " + (task.description || "")).toLowerCase();

  // Find matching subtasks from mock data
  let subtasks = null;
  for (const [keywords, items] of Object.entries(mockData.keywords)) {
    const keywordList = keywords.split("|");
    if (keywordList.some((kw) => titleLower.includes(kw))) {
      subtasks = items;
      break;
    }
  }

  // Use fallback if no keyword match
  if (!subtasks) {
    subtasks = mockData.fallback;
  }

  console.log(`[decompose] Generating ${subtasks.length} subtasks for "${task.title}"`);

  // Create each subtask via the API
  const created = [];
  for (const subtask of subtasks) {
    const response = await fetch(`${apiUrl}/api/projects/${task.project_id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: subtask.title,
        description: subtask.description || null,
        assigned_user_id: task.assigned_user_id,
        parent_task_id: task.id,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[decompose] Failed to create subtask: ${response.status} ${body}`);
      continue;
    }

    const createdTask = await response.json();
    created.push(createdTask.id);
  }

  return { subtasks_created: created.length, subtask_ids: created };
}

module.exports = { processDecompose };
