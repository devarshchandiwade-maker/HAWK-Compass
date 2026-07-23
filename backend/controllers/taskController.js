const db = require("../db/db");
const sendTaskMail = require("../utils/mailService");

// Get all tasks
const getTasks = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
          id,
          title,
          assignee,
          user_id,
          priority,
          status,
          due_date AS dueDate,
          notes,
          created_at
      FROM tasks
      ORDER BY created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// Add task
const addTask = async (req, res) => {
  try {
    const {
    title,
    assignee,
    user_id,
    priority,
    status,
    due_date,
    notes,
} = req.body;

    await db.query(
    `INSERT INTO tasks
    (
        title,
        assignee,
        user_id,
        priority,
        status,
        due_date,
        notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
        title,
        assignee,
        user_id,
        priority,
        status,
        due_date,
        notes,
    ]
);
    console.log("REQ BODY:", req.body);
    const [rows] = await db.query(`
    SELECT
        t.id,
        t.title,
        t.assignee,
        t.user_id,
        t.priority,
        t.status,
        t.due_date AS dueDate,
        t.notes,
        t.created_at
    FROM tasks t
    ORDER BY t.created_at DESC
`);

    res.json(rows);
    

    if (user_id && status !== "Done" && due_date && due_date !== "0000-00-00") {

    const [users] = await db.query(
        `SELECT
            u.name,
            u.email,
            n.notification_type
         FROM users u
         LEFT JOIN notification_settings n
         ON n.user_id = u.id
         WHERE u.id = ?`,
        [user_id]
    );

    if (
        users.length > 0 &&
        users[0].notification_type === "updates"
    ) {

        await sendTaskMail(
            users[0].email,
            users[0].name,
            { title, priority, status, due_date, notes },
            { isNew: true, changes: [] }
        );

    }

}

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, assignee, user_id, priority, status, due_date, notes } = req.body;

    // 1. Grab the existing row BEFORE updating
    const [existingRows] = await db.query(
      `SELECT title, assignee, user_id, priority, status, due_date, notes FROM tasks WHERE id = ?`,
      [id]
    );
    const oldTask = existingRows[0];

    // 2. Perform the update (unchanged)
    await db.query(
      `UPDATE tasks SET title=?, assignee=?, user_id=?, priority=?, status=?, due_date=?, notes=? WHERE id=?`,
      [title, assignee, user_id, priority, status, due_date, notes, id]
    );

    const [rows] = await db.query(`
      SELECT id, title, assignee, priority, status, due_date AS dueDate, notes, created_at
      FROM tasks ORDER BY created_at DESC
    `);
    res.json(rows);

    // 3. Figure out what actually changed
    const isNewAssignment = oldTask && String(oldTask.user_id) !== String(user_id);

    const fieldsToCheck = ["title", "priority", "status", "due_date", "notes"];
    const changes = oldTask
      ? fieldsToCheck
          .filter((f) => String(oldTask[f] ?? "") !== String(req.body[f] ?? ""))
          .map((f) => ({ field: f, oldValue: oldTask[f], newValue: req.body[f] }))
      : [];

    if (user_id && status !== "Done" && due_date && due_date !== "0000-00-00") {
      const [users] = await db.query(
        `SELECT u.name, u.email, n.notification_type
         FROM users u
         LEFT JOIN notification_settings n ON n.user_id = u.id
         WHERE u.id = ?`,
        [user_id]
      );

      // Skip sending entirely if nothing actually changed and it's not a new assignment
      const shouldSend = isNewAssignment || changes.length > 0;

      if (shouldSend && users.length > 0 && users[0].notification_type === "updates") {
        await sendTaskMail(
          users[0].email,
          users[0].name,
          { title, priority, status, due_date, notes },
          { isNew: isNewAssignment, changes }
        );
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {

    await db.query(
      "DELETE FROM tasks WHERE id=?",
      [req.params.id]
    );

    const [rows] = await db.query(`
      SELECT
          id,
          title,
          assignee,
          user_id,
          priority,
          status,
          due_date AS dueDate,
          notes,
          created_at
      FROM tasks
      ORDER BY created_at DESC
    `);

    res.json(rows);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
};