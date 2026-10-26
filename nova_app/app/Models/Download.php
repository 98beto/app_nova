<?php

namespace App\Models;

use Database\Factories\DownloadFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/** @property Carbon $downloaded_at */
#[Fillable(['user_id', 'application_id', 'downloaded_at'])]
class Download extends Model
{
    /** @use HasFactory<DownloadFactory> */
    use HasFactory;

    /** @return BelongsTo<Application, $this> */
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    protected function casts(): array
    {
        return [
            'downloaded_at' => 'datetime',
            'price_paid' => 'decimal:2',
            'store_commission' => 'decimal:2',
            'developer_net' => 'decimal:2',
        ];
    }
}
