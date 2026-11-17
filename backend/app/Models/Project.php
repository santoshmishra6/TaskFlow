<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'description', 'owner_id', 'start_date', 'due_date', 'status',
    ];

    protected function casts(): array
    {
        return ['start_date' => 'date', 'due_date' => 'date'];
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
