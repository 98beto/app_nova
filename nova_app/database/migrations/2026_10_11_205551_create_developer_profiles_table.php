<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('developer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->restrictOnDelete();
            $table->string('company_name');
            $table->string('payment_status')->default('pending');
            $table->timestampTz('activated_at')->nullable();
            $table->timestampsTz();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE developer_profiles ADD CONSTRAINT developer_profiles_payment_status_check CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'))");
            DB::statement("ALTER TABLE developer_profiles ADD CONSTRAINT developer_profiles_payment_activated_at_check CHECK ((payment_status IN ('paid', 'refunded') AND activated_at IS NOT NULL) OR (payment_status IN ('pending', 'failed') AND activated_at IS NULL))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('developer_profiles');
    }
};
