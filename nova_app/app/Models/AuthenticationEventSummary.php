<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use LogicException;

class AuthenticationEventSummary extends Model
{
    protected $table = 'authentication_event_summaries';

    public $timestamps = false;

    public $incrementing = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'total_events' => 'integer',
            'first_occurred_at' => 'datetime',
            'last_occurred_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (): never {
            throw new LogicException('Authentication event summaries are read-only.');
        });

        static::deleting(function (): never {
            throw new LogicException('Authentication event summaries are read-only.');
        });
    }

    /**
     * @return Builder<static>
     */
    public function newQuery(): Builder
    {
        if (DB::getDriverName() !== 'pgsql') {
            throw new LogicException('Authentication event summaries are only available on PostgreSQL.');
        }

        return $this->newModelQuery();
    }

    public function save(array $options = []): bool
    {
        throw new LogicException('Authentication event summaries are read-only.');
    }

    public function delete(): ?bool
    {
        throw new LogicException('Authentication event summaries are read-only.');
    }
}
