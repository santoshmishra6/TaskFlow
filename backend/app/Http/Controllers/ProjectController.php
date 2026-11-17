<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProjectController extends Controller
{
    public function index()
    {
        return Project::withCount('tasks')->latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string'],
            'owner_id' => ['nullable', 'integer', 'exists:users,id'],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', Rule::in(['Planning', 'Active', 'On Hold', 'Completed'])],
        ]);
        $validated['status'] = $validated['status'] ?? 'Planning';
        $project = Project::create($validated);
        return response()->json($project->loadCount('tasks'), 201);
    }

    public function show(Project $project)
    {
        return $project->load('tasks');
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:160'],
            'description' => ['nullable', 'string'],
            'owner_id' => ['nullable', 'integer', 'exists:users,id'],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['sometimes', Rule::in(['Planning', 'Active', 'On Hold', 'Completed'])],
        ]);
        $project->update($validated);
        return $project->loadCount('tasks');
    }

    public function destroy(Project $project)
    {
        $project->delete();
        return response()->noContent();
    }
}
