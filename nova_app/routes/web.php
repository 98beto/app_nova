<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'Welcome')->name('home');

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login.store');
    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store'])->name('register.store');
});

Route::middleware('auth')->group(function (): void {
    Route::delete('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::middleware('active')->group(function (): void {
        Route::get('/store', fn () => Inertia::render('store/Index'))
            ->middleware('role:user')
            ->name('store');
        Route::get('/developer/dashboard', fn () => Inertia::render('developer/Dashboard'))
            ->middleware('role:developer')
            ->name('developer.dashboard');
        Route::get('/admin/dashboard', fn () => Inertia::render('admin/Dashboard'))
            ->middleware('role:admin')
            ->name('admin.dashboard');
    });
});
