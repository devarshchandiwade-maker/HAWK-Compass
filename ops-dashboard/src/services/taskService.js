import {
    getTasks,
    addTask,
    updateTask,
    deleteTask
} from "../api/taskApi";

export const fetchTasks = async () => {
    const res = await getTasks();
    return res.data;
};

export const createTask = async (task) => {
    await addTask(task);
    return await fetchTasks();
};

export const editTask = async (id, task) => {
    await updateTask(id, task);
    return await fetchTasks();
};

export const removeTask = async (id) => {
    await deleteTask(id);
    return await fetchTasks();
};