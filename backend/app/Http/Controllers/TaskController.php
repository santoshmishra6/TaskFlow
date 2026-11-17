<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $query = Task::with('project:id,name')->latest();
        if ($request->filled('status')) $query->where('status', $request->string('status'));
        if ($request->filled('project_id')) $query->where('project_id', $request->integer('project_id'));
        return $query->paginate(50);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'priority' => ['nullable', Rule::in(['Low', 'Medium', 'High', 'Urgent'])],
            'status' => ['nullable', Rule::in(['To Do', 'In Progress', 'In Review', 'Completed'])],
            'due_date' => ['nullable', 'date'],
        ]);
        $validated['priority'] = $validated['priority'] ?? 'Medium';
        $validated['status'] = $validated['status'] ?? 'To Do';
        $task = Task::create($validated);
        return response()->json($task->load('project:id,name'), 201);
    }

    public function show(Task $task)
    {
        return $task->load('project:id,name', 'assignee:id,name,email');
    }

    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'project_id' => ['sometimes', 'nullable', 'integer', 'exists:projects,id'],
            'assigned_to' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'priority' => ['sometimes', Rule::in(['Low', 'Medium', 'High', 'Urgent'])],
            'status' => ['sometimes', Rule::in(['To Do', 'In Progress', 'In Review', 'Completed'])],
            'due_date' => ['nullable', 'date'],
        ]);
        $task->update($validated);
        return $task->load('project:id,name');
    }

    public function destroy(Task $task)
    {
        $task->delete();
        return response()->noContent();
    }
}
