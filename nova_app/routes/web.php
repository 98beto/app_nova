<?php

use App\Enums\UserRole;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\DeveloperApplicationController;
use App\Http\Controllers\DownloadController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\StoreController;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function (Request $request): RedirectResponse {
    /** @var User|null $user */
    $user = $request->user();

    if ($user === null) {
        return redirect()->route('store');
    }

    return redirect()->route(match ($user->role) {
        UserRole::User => 'store',
        UserRole::Developer => 'store',
        UserRole::Admin => 'admin.dashboard',
    });
})->name('home');

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login.store');
    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store'])->name('register.store');
});

Route::middleware('auth')->group(function (): void {
    Route::delete('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::middleware('active')->group(function (): void {
        Route::get('/developer/dashboard', [DeveloperApplicationController::class, 'index'])
            ->middleware('role:developer')
            ->name('developer.dashboard');
        Route::middleware('role:developer')->group(function (): void {
            Route::get('/developer/applications', [DeveloperApplicationController::class, 'index'])->name('developer.applications.index');
            Route::get('/developer/applications/create', [DeveloperApplicationController::class, 'create'])->name('developer.applications.create');
            Route::get('/developer/applications/{application}', [DeveloperApplicationController::class, 'show'])->name('developer.applications.show');
            Route::post('/developer/applications', [DeveloperApplicationController::class, 'store'])->name('developer.applications.store');
        });
        Route::middleware('role:user,developer')->group(function (): void {
            Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
            Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
            Route::post('/store/{application}/downloads', [DownloadController::class, 'store'])->name('downloads.store');
            Route::put('/store/{application}/review', [ReviewController::class, 'update'])->name('reviews.update');
            Route::put('/reviews/{review}/like', [ReviewController::class, 'like'])->name('reviews.like');
        });
        Route::get('/admin/dashboard', fn () => Inertia::render('admin/Dashboard'))
            ->middleware('role:admin')
            ->name('admin.dashboard');
    });
});

Route::get('/store', [StoreController::class, 'index'])->name('store');
Route::get('/store/{application}', [StoreController::class, 'show'])->name('store.show');
