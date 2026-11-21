import { getStore } from "@netlify/blobs";

const DEFAULT_TASKS = [
  {
    id: "task-felt-tree",
    title: "Find the felt Christmas tree in the attic",
    assignee: "DaDad",
    category: "Other",
    priority: "High",
    notes: "Check the holiday storage bins near the attic stairs",
    doToday: true,
    completed: false,
    createdAt: Date.now()
  },
  {
    id: "task-starter-2",
    title: "Pick up groceries and snacks for the week",
    assignee: "Momma",
    category: "Shopping",
    priority: "Medium",
    notes: "",
    doToday: true,
    completed: false,
    createdAt: Date.now() - 1000
  },
  {
    id: "task-starter-3",
    title: "Feed the dogs and refill water bowls",
    assignee: "Porkchop",
    category: "Other",
    priority: "Medium",
    notes: "",
    doToday: false,
    completed: false,
    createdAt: Date.now() - 2000
  }
];

export default async (req) => {
  const store = getStore("honey-do-household");

  if (req.method === "GET") {
    let data = await store.get("tasks", { type: "json" });
    if (!data || !Array.isArray(data)) {
      data = DEFAULT_TASKS;
      await store.setJSON("tasks", data);
    }
    return Response.json({ tasks: data });
  }

  if (req.method === "POST") {
    const body = await req.json();
    if (!Array.isArray(body.tasks)) {
      return Response.json({ error: "Invalid tasks payload" }, { status: 400 });
    }
    await store.setJSON("tasks", body.tasks);
    return Response.json({ ok: true, tasks: body.tasks });
  }

  return new Response("Method Not Allowed", { status: 405 });
};
