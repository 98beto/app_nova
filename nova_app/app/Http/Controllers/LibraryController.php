<?php

namespace App\Http\Controllers;

use App\Services\StoreQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LibraryController extends Controller
{
    public function index(Request $request, StoreQuery $query): JsonResponse|Response
    {
        $request->validate(['library_page' => ['sometimes', 'integer', 'min:1']]);
        $data = $query->library($request);

        return $request->is('api/*') || $request->expectsJson() ? response()->json($data) : Inertia::render('library/Index', $data);
    }
}
