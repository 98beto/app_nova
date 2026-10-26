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
        Schema::table('downloads', function (Blueprint $table) {
            $table->decimal('price_paid', 12, 2)->default(0);
            $table->decimal('store_commission', 12, 2)->default(0);
            $table->decimal('developer_net', 12, 2)->default(0);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE downloads ADD CONSTRAINT downloads_price_paid_non_negative CHECK (price_paid >= 0)');
            DB::statement('ALTER TABLE downloads ADD CONSTRAINT downloads_commission_non_negative CHECK (store_commission >= 0)');
            DB::statement('ALTER TABLE downloads ADD CONSTRAINT downloads_developer_net_non_negative CHECK (developer_net >= 0)');
            DB::statement('ALTER TABLE downloads ADD CONSTRAINT downloads_amount_breakdown CHECK (price_paid = store_commission + developer_net)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('downloads', function (Blueprint $table) {
            $table->dropColumn(['price_paid', 'store_commission', 'developer_net']);
        });
    }
};
