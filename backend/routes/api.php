<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;

Route::get('/health', fn () => response()->json([
    'status' => 'ok',
    'app' => 'TaskFlow'
]));

Route::apiResource('projects', ProjectController::class);
Route::apiResource('tasks', TaskController::class);
