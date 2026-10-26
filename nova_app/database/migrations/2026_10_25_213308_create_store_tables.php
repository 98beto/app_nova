<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 120)->unique();
            $table->string('slug', 140)->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });
        Schema::create('applications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('developer_id')->constrained('developer_profiles')->restrictOnDelete();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('icon_path', 2048)->nullable();
            $table->text('description');
            $table->unsignedSmallInteger('minimum_age')->default(0);
            $table->decimal('price', 12, 2)->default(0);
            $table->string('status')->default('draft');
            $table->timestampTz('published_at')->nullable();
            $table->timestamps();
            $table->index(['developer_id', 'status']);
            $table->index(['category_id', 'status', 'published_at']);
        });
        Schema::create('application_screenshots', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->string('image_path', 2048);
            $table->unsignedSmallInteger('position');
            $table->timestamps();
            $table->unique(['application_id', 'position']);
        });
        Schema::create('downloads', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('application_id')->constrained()->restrictOnDelete();
            $table->timestampTz('downloaded_at')->useCurrent();
            $table->timestamps();
            $table->unique(['user_id', 'application_id']);
            $table->index(['application_id', 'downloaded_at']);
            $table->index(['user_id', 'downloaded_at']);
        });
        Schema::create('reviews', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('application_id')->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('rating');
            $table->text('body')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'application_id']);
            $table->index(['application_id', 'rating']);
        });
        Schema::create('review_likes', function (Blueprint $table): void {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('review_id')->constrained()->cascadeOnDelete();
            $table->timestampTz('created_at')->useCurrent();
            $table->primary(['user_id', 'review_id']);
            $table->index(['review_id', 'created_at']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE applications ADD CONSTRAINT applications_minimum_age_range CHECK (minimum_age BETWEEN 0 AND 18)');
            DB::statement('ALTER TABLE applications ADD CONSTRAINT applications_price_non_negative CHECK (price >= 0)');
            DB::statement("ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'unpublished'))");
            DB::statement("ALTER TABLE applications ADD CONSTRAINT applications_published_approval_data CHECK (published_at IS NULL OR (status = 'approved' AND icon_path IS NOT NULL))");
            DB::statement('ALTER TABLE application_screenshots ADD CONSTRAINT application_screenshots_position_range CHECK (position BETWEEN 1 AND 4)');
            DB::statement('ALTER TABLE reviews ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('review_likes');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('downloads');
        Schema::dropIfExists('application_screenshots');
        Schema::dropIfExists('applications');
        Schema::dropIfExists('categories');
    }
};
