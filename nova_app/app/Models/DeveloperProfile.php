<?php

namespace App\Models;

use App\Enums\DeveloperPaymentStatus;
use Database\Factories\DeveloperProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $company_name
 * @property DeveloperPaymentStatus $payment_status
 * @property Carbon|null $activated_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 */
#[Fillable(['user_id', 'company_name', 'payment_status', 'activated_at'])]
class DeveloperProfile extends Model
{
    /** @use HasFactory<DeveloperProfileFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payment_status' => DeveloperPaymentStatus::class,
            'activated_at' => 'datetime',
        ];
    }
}
