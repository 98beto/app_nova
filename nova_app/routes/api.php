<?php

use App\Http\Controllers\Api\V1\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Api\V1\Auth\RegisteredUserController;
use App\Http\Controllers\DeveloperApplicationController;
use App\Http\Controllers\DownloadController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\StoreController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/auth')->group(function (): void {
    Route::post('/register', [RegisteredUserController::class, 'store'])->middleware('guest');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->middleware('guest');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
        Route::get('/user', [AuthenticatedSessionController::class, 'show'])->middleware('active');
    });
});

Route::prefix('v1')->group(function (): void {
    Route::get('/applications', [StoreController::class, 'index']);
    Route::get('/applications/{application}', [StoreController::class, 'show']);
    Route::get('/categories', [StoreController::class, 'categories']);
    Route::middleware(['auth:sanctum', 'active'])->group(function (): void {
        Route::middleware('role:user,developer')->group(function (): void {
            Route::get('/profile', [ProfileController::class, 'show']);
            Route::patch('/profile', [ProfileController::class, 'update']);
            Route::post('/applications/{application}/downloads', [DownloadController::class, 'store']);
            Route::put('/applications/{application}/review', [ReviewController::class, 'update']);
            Route::put('/reviews/{review}/like', [ReviewController::class, 'like']);
        });
        Route::middleware('role:developer')->group(function (): void {
            Route::get('/developer/applications', [DeveloperApplicationController::class, 'index']);
            Route::get('/developer/applications/{application}', [DeveloperApplicationController::class, 'show']);
            Route::post('/developer/applications', [DeveloperApplicationController::class, 'store']);
        });
    });
});
